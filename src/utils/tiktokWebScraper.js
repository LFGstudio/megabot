const puppeteer = require('puppeteer');

class TikTokWebScraper {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  // Initialize browser
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🚀 Initializing TikTok web scraper...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.isInitialized = true;
      console.log('✅ TikTok web scraper initialized');
    } catch (error) {
      console.error('❌ Error initializing TikTok scraper:', error);
      throw error;
    }
  }

  // Scrape TikTok account videos
  async scrapeAccountVideos(username) {
    try {
      await this.initialize();
      
      const page = await this.browser.newPage();
      
      // Set user agent to avoid detection
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      const accountUrl = `https://www.tiktok.com/@${username}`;
      console.log(`🔍 Scraping TikTok account: ${accountUrl}`);
      
      // Navigate to the account page
      await page.goto(accountUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for videos to load
      await page.waitForTimeout(3000);
      
      // Scroll to load more videos
      await this.scrollToLoadVideos(page);
      
      // Extract video data
      const videos = await page.evaluate(() => {
        const videoElements = document.querySelectorAll('[data-e2e="user-post-item"]');
        const videos = [];
        
        videoElements.forEach((element, index) => {
          try {
            // Extract video URL
            const linkElement = element.querySelector('a');
            const videoUrl = linkElement ? linkElement.href : null;
            
            // Extract video ID from URL
            const videoId = videoUrl ? videoUrl.split('/video/')[1]?.split('?')[0] : `video_${index}`;
            
            // Extract caption
            const captionElement = element.querySelector('[data-e2e="user-post-item-desc"]');
            const caption = captionElement ? captionElement.textContent.trim() : '';
            
            // Extract view count
            const viewElement = element.querySelector('[data-e2e="video-views"]');
            const viewText = viewElement ? viewElement.textContent : '0';
            const views = this.parseViewCount(viewText);
            
            // Extract post date (if available)
            const dateElement = element.querySelector('[data-e2e="user-post-item-time"]');
            const postDate = dateElement ? new Date(dateElement.textContent) : new Date();
            
            if (videoUrl && videoId) {
              videos.push({
                id: videoId,
                url: videoUrl,
                caption: caption,
                posted_at: postDate,
                views: views,
                tier1_views: Math.floor(views * 0.3) // Estimate 30% Tier 1 views
              });
            }
          } catch (error) {
            console.error('Error extracting video data:', error);
          }
        });
        
        return videos;
      });
      
      await page.close();
      
      console.log(`📱 Found ${videos.length} videos for @${username}`);
      return videos;
      
    } catch (error) {
      console.error(`❌ Error scraping account @${username}:`, error);
      return [];
    }
  }

  // Scroll to load more videos
  async scrollToLoadVideos(page) {
    try {
      let previousHeight = 0;
      let currentHeight = await page.evaluate('document.body.scrollHeight');
      
      // Scroll down to load more videos (max 5 times to avoid infinite scroll)
      for (let i = 0; i < 5 && currentHeight > previousHeight; i++) {
        previousHeight = currentHeight;
        
        // Scroll down
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        
        // Wait for new content to load
        await page.waitForTimeout(2000);
        
        // Check if new content loaded
        currentHeight = await page.evaluate('document.body.scrollHeight');
      }
    } catch (error) {
      console.error('Error scrolling to load videos:', error);
    }
  }

  // Parse view count text (e.g., "1.2M" -> 1200000)
  parseViewCount(viewText) {
    if (!viewText) return 0;
    
    const text = viewText.toLowerCase().replace(/[^\d.kkmb]/g, '');
    
    if (text.includes('k')) {
      return Math.floor(parseFloat(text) * 1000);
    } else if (text.includes('m')) {
      return Math.floor(parseFloat(text) * 1000000);
    } else if (text.includes('b')) {
      return Math.floor(parseFloat(text) * 1000000000);
    } else {
      return parseInt(text) || 0;
    }
  }

  // Scrape individual video details
  async scrapeVideoDetails(videoUrl) {
    try {
      await this.initialize();
      
      const page = await this.browser.newPage();
      
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      console.log(`🔍 Scraping video details: ${videoUrl}`);
      
      // Navigate to video page
      await page.goto(videoUrl, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      // Wait for video to load
      await page.waitForTimeout(3000);
      
      // Extract detailed video data
      const videoData = await page.evaluate(() => {
        try {
          // Extract view count
          const viewElement = document.querySelector('[data-e2e="video-views"]');
          const viewText = viewElement ? viewElement.textContent : '0';
          
          // Extract like count
          const likeElement = document.querySelector('[data-e2e="video-like-count"]');
          const likeText = likeElement ? likeElement.textContent : '0';
          
          // Extract comment count
          const commentElement = document.querySelector('[data-e2e="video-comment-count"]');
          const commentText = commentElement ? commentElement.textContent : '0';
          
          // Extract share count
          const shareElement = document.querySelector('[data-e2e="video-share-count"]');
          const shareText = shareElement ? shareElement.textContent : '0';
          
          // Extract caption
          const captionElement = document.querySelector('[data-e2e="video-desc"]');
          const caption = captionElement ? captionElement.textContent.trim() : '';
          
          return {
            views: viewText,
            likes: likeText,
            comments: commentText,
            shares: shareText,
            caption: caption
          };
        } catch (error) {
          console.error('Error extracting video details:', error);
          return null;
        }
      });
      
      await page.close();
      
      if (videoData) {
        return {
          views: this.parseViewCount(videoData.views),
          likes: this.parseViewCount(videoData.likes),
          comments: this.parseViewCount(videoData.comments),
          shares: this.parseViewCount(videoData.shares),
          caption: videoData.caption
        };
      }
      
      return null;
      
    } catch (error) {
      console.error(`❌ Error scraping video details for ${videoUrl}:`, error);
      return null;
    }
  }

  // Close browser
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('🔒 TikTok scraper browser closed');
    }
  }

  // Health check
  async healthCheck() {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      await page.goto('https://www.tiktok.com', { timeout: 10000 });
      await page.close();
      return true;
    } catch (error) {
      console.error('❌ TikTok scraper health check failed:', error);
      return false;
    }
  }
}

module.exports = new TikTokWebScraper();
