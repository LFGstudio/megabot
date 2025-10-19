const puppeteer = require('puppeteer');

class TikTokWebScraper {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
    this.maxRetries = 3;
    this.delayBetweenRequests = 2000; // 2 seconds
  }

  // Initialize browser with enhanced stealth settings
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🚀 Initializing enhanced TikTok web scraper...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-back-forward-cache',
          '--disable-ipc-flooding-protection',
          '--no-default-browser-check',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps'
        ]
      });
      
      this.isInitialized = true;
      console.log('✅ Enhanced TikTok web scraper initialized');
    } catch (error) {
      console.error('❌ Error initializing TikTok scraper:', error);
      throw error;
    }
  }

  // Enhanced TikTok account video scraping with detailed metrics
  async scrapeAccountVideos(username) {
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        await this.initialize();
        
        const page = await this.browser.newPage();
        
        // Enhanced stealth settings
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set extra headers to avoid detection
        await page.setExtraHTTPHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        });
        
        const accountUrl = `https://www.tiktok.com/@${username}`;
        console.log(`🔍 Scraping TikTok account: ${accountUrl} (Attempt ${retryCount + 1})`);
        
        // Navigate with enhanced settings
        await page.goto(accountUrl, { 
          waitUntil: 'networkidle0',
          timeout: 60000 
        });
        
        // Wait for content to load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Scroll to load more videos
        await this.scrollToLoadVideos(page);
        
        // Extract video data with enhanced selectors
        const videos = await page.evaluate(() => {
          const videos = [];
          
          // Try multiple selector patterns for video elements
          const selectors = [
            '[data-e2e="user-post-item"]',
            '[data-e2e="user-post-item-desc"]',
            'div[data-e2e="user-post-item"]',
            '.video-feed-item',
            '.tiktok-1qb12g8-DivContainer-StyledDivContainer'
          ];
          
          let videoElements = [];
          for (const selector of selectors) {
            videoElements = document.querySelectorAll(selector);
            if (videoElements.length > 0) break;
          }
          
          console.log(`Found ${videoElements.length} video elements`);
          
          videoElements.forEach((element, index) => {
            try {
              // Extract video URL with multiple methods
              let videoUrl = null;
              const linkSelectors = [
                'a[href*="/video/"]',
                'a',
                '[data-e2e="user-post-item-link"]'
              ];
              
              for (const linkSelector of linkSelectors) {
                const linkElement = element.querySelector(linkSelector);
                if (linkElement && linkElement.href && linkElement.href.includes('/video/')) {
                  videoUrl = linkElement.href;
                  break;
                }
              }
              
              if (!videoUrl) {
                // Try to find URL in parent elements
                let parent = element.parentElement;
                for (let i = 0; i < 3 && parent; i++) {
                  const linkElement = parent.querySelector('a[href*="/video/"]');
                  if (linkElement) {
                    videoUrl = linkElement.href;
                    break;
                  }
                  parent = parent.parentElement;
                }
              }
              
              // Extract video ID from URL
              let videoId = `video_${index}`;
              if (videoUrl) {
                const idMatch = videoUrl.match(/\/video\/(\d+)/);
                if (idMatch) {
                  videoId = idMatch[1];
                }
              }
              
              // Extract caption with multiple selectors
              let caption = '';
              const captionSelectors = [
                '[data-e2e="user-post-item-desc"]',
                '[data-e2e="video-desc"]',
                '.video-meta-caption',
                '.tiktok-1qb12g8-DivText-StyledDivText'
              ];
              
              for (const captionSelector of captionSelectors) {
                const captionElement = element.querySelector(captionSelector);
                if (captionElement && captionElement.textContent.trim()) {
                  caption = captionElement.textContent.trim();
                  break;
                }
              }
              
              // Extract view count with multiple selectors
              let views = 0;
              const viewSelectors = [
                '[data-e2e="video-views"]',
                '[data-e2e="user-post-item-views"]',
                '.video-meta-views',
                '.tiktok-1qb12g8-DivText-StyledDivText'
              ];
              
              for (const viewSelector of viewSelectors) {
                const viewElement = element.querySelector(viewSelector);
                if (viewElement && viewElement.textContent) {
                  const viewText = viewElement.textContent.trim();
                  if (viewText && viewText !== '0') {
                    views = this.parseViewCount(viewText);
                    break;
                  }
                }
              }
              
              // Extract post date
              let postDate = new Date();
              const dateSelectors = [
                '[data-e2e="user-post-item-time"]',
                '.video-meta-time',
                'time'
              ];
              
              for (const dateSelector of dateSelectors) {
                const dateElement = element.querySelector(dateSelector);
                if (dateElement) {
                  try {
                    postDate = new Date(dateElement.textContent || dateElement.getAttribute('datetime'));
                    if (isNaN(postDate.getTime())) {
                      postDate = new Date();
                    }
                    break;
                  } catch (e) {
                    postDate = new Date();
                  }
                }
              }
              
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
        
        // If we got videos, return them; otherwise retry
        if (videos.length > 0) {
          console.log(`📱 Found ${videos.length} videos for @${username}`);
          return videos;
        } else {
          console.log(`⚠️ No videos found for @${username}, retrying...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests * retryCount));
        }
        
      } catch (error) {
        console.error(`❌ Error scraping account @${username} (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests * retryCount));
        }
      }
    }
    
    console.error(`❌ Failed to scrape @${username} after ${this.maxRetries} attempts`);
    return [];
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
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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

  // Enhanced individual video details scraping with comprehensive metrics
  async scrapeVideoDetails(videoUrl) {
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      try {
        await this.initialize();
        
        const page = await this.browser.newPage();
        
        // Enhanced stealth settings
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set extra headers
        await page.setExtraHTTPHeaders({
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        });
        
        console.log(`🔍 Scraping video details: ${videoUrl} (Attempt ${retryCount + 1})`);
        
        // Navigate to video page
        await page.goto(videoUrl, { 
          waitUntil: 'networkidle0',
          timeout: 60000 
        });
        
        // Wait for video to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Scroll down slightly to ensure all elements are loaded
        await page.evaluate(() => {
          window.scrollTo(0, 100);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Extract detailed video data with comprehensive selectors
        const videoData = await page.evaluate(() => {
          try {
            // Function to parse view counts
            const parseCount = (text) => {
              if (!text) return 0;
              const cleanText = text.toLowerCase().replace(/[^\d.kkmb]/g, '');
              
              if (cleanText.includes('k')) {
                return Math.floor(parseFloat(cleanText) * 1000);
              } else if (cleanText.includes('m')) {
                return Math.floor(parseFloat(cleanText) * 1000000);
              } else if (cleanText.includes('b')) {
                return Math.floor(parseFloat(cleanText) * 1000000000);
              } else {
                return parseInt(cleanText) || 0;
              }
            };
            
            // Extract view count with multiple selectors
            let views = 0;
            const viewSelectors = [
              '[data-e2e="video-views"]',
              '[data-e2e="browse-video-desc"]',
              '.video-meta-views',
              '.tiktok-1qb12g8-DivText-StyledDivText',
              '[class*="view"]',
              '[class*="View"]'
            ];
            
            for (const selector of viewSelectors) {
              const elements = document.querySelectorAll(selector);
              for (const element of elements) {
                const text = element.textContent;
                if (text && (text.includes('views') || text.includes('view') || /[\d.kkmb]/.test(text))) {
                  const parsed = parseCount(text);
                  if (parsed > views) {
                    views = parsed;
                  }
                }
              }
            }
            
            // Extract like count with multiple selectors
            let likes = 0;
            const likeSelectors = [
              '[data-e2e="video-like-count"]',
              '[data-e2e="browse-like-count"]',
              '.video-meta-likes',
              '[class*="like"]',
              '[class*="Like"]'
            ];
            
            for (const selector of likeSelectors) {
              const elements = document.querySelectorAll(selector);
              for (const element of elements) {
                const text = element.textContent;
                if (text && (text.includes('likes') || text.includes('like') || /[\d.kkmb]/.test(text))) {
                  const parsed = parseCount(text);
                  if (parsed > likes) {
                    likes = parsed;
                  }
                }
              }
            }
            
            // Extract comment count with multiple selectors
            let comments = 0;
            const commentSelectors = [
              '[data-e2e="video-comment-count"]',
              '[data-e2e="browse-comment-count"]',
              '.video-meta-comments',
              '[class*="comment"]',
              '[class*="Comment"]'
            ];
            
            for (const selector of commentSelectors) {
              const elements = document.querySelectorAll(selector);
              for (const element of elements) {
                const text = element.textContent;
                if (text && (text.includes('comments') || text.includes('comment') || /[\d.kkmb]/.test(text))) {
                  const parsed = parseCount(text);
                  if (parsed > comments) {
                    comments = parsed;
                  }
                }
              }
            }
            
            // Extract share count
            let shares = 0;
            const shareSelectors = [
              '[data-e2e="video-share-count"]',
              '[data-e2e="browse-share-count"]',
              '.video-meta-shares',
              '[class*="share"]',
              '[class*="Share"]'
            ];
            
            for (const selector of shareSelectors) {
              const elements = document.querySelectorAll(selector);
              for (const element of elements) {
                const text = element.textContent;
                if (text && (text.includes('shares') || text.includes('share') || /[\d.kkmb]/.test(text))) {
                  const parsed = parseCount(text);
                  if (parsed > shares) {
                    shares = parsed;
                  }
                }
              }
            }
            
            // Extract caption
            let caption = '';
            const captionSelectors = [
              '[data-e2e="video-desc"]',
              '[data-e2e="browse-video-desc"]',
              '.video-meta-caption',
              '.tiktok-1qb12g8-DivText-StyledDivText',
              '[class*="desc"]',
              '[class*="caption"]'
            ];
            
            for (const selector of captionSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent.trim()) {
                caption = element.textContent.trim();
                break;
              }
            }
            
            // Extract author info
            let author = '';
            const authorSelectors = [
              '[data-e2e="browser-nickname"]',
              '[data-e2e="video-author-uniqueid"]',
              '.video-meta-author',
              '[class*="author"]',
              '[class*="nickname"]'
            ];
            
            for (const selector of authorSelectors) {
              const element = document.querySelector(selector);
              if (element && element.textContent.trim()) {
                author = element.textContent.trim();
                break;
              }
            }
            
            return {
              views: views,
              likes: likes,
              comments: comments,
              shares: shares,
              caption: caption,
              author: author
            };
          } catch (error) {
            console.error('Error extracting video details:', error);
            return null;
          }
        });
        
        await page.close();
        
        // If we got valid data, return it
        if (videoData && (videoData.views > 0 || videoData.likes > 0 || videoData.comments > 0)) {
          console.log(`✅ Scraped video details: ${videoData.views} views, ${videoData.likes} likes, ${videoData.comments} comments`);
          return videoData;
        } else {
          console.log(`⚠️ No valid data found for video, retrying...`);
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests * retryCount));
        }
        
      } catch (error) {
        console.error(`❌ Error scraping video details for ${videoUrl} (attempt ${retryCount + 1}):`, error);
        retryCount++;
        
        if (retryCount < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests * retryCount));
        }
      }
    }
    
    console.error(`❌ Failed to scrape video details for ${videoUrl} after ${this.maxRetries} attempts`);
    return null;
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

  // Scrape individual video with comprehensive metrics
  async scrapeIndividualVideo(videoUrl) {
    try {
      console.log(`🎯 Scraping individual video: ${videoUrl}`);
      
      // First, try to get basic info from the video page
      const basicData = await this.scrapeVideoDetails(videoUrl);
      
      if (!basicData) {
        console.log(`⚠️ Could not get basic data for ${videoUrl}`);
        return null;
      }
      
      // Return comprehensive video data
      return {
        url: videoUrl,
        views: basicData.views,
        likes: basicData.likes,
        comments: basicData.comments,
        shares: basicData.shares,
        caption: basicData.caption,
        author: basicData.author,
        scraped_at: new Date(),
        tier1_views: Math.floor(basicData.views * 0.3) // Estimate 30% Tier 1 views
      };
      
    } catch (error) {
      console.error(`❌ Error scraping individual video ${videoUrl}:`, error);
      return null;
    }
  }

  // Batch scrape multiple videos with rate limiting
  async scrapeMultipleVideos(videoUrls) {
    const results = [];
    const batchSize = 3; // Process 3 videos at a time to avoid rate limiting
    
    console.log(`📊 Starting batch scrape of ${videoUrls.length} videos`);
    
    for (let i = 0; i < videoUrls.length; i += batchSize) {
      const batch = videoUrls.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videoUrls.length / batchSize)}`);
      
      const batchPromises = batch.map(async (url, index) => {
        // Add delay between requests in the same batch
        await new Promise(resolve => setTimeout(resolve, index * 1000));
        return await this.scrapeIndividualVideo(url);
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => result !== null));
      
      // Add delay between batches
      if (i + batchSize < videoUrls.length) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log(`✅ Batch scrape completed: ${results.length}/${videoUrls.length} videos scraped successfully`);
    return results;
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
