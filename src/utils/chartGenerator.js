const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

class ChartGenerator {
  constructor() {
    this.canvasWidth = 800;
    this.canvasHeight = 400;
  }

  // Generate a simple performance chart
  async generatePerformanceChart(data) {
    try {
      const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('TikTok Performance Chart', this.canvasWidth / 2, 40);

      // Chart area
      const chartX = 50;
      const chartY = 80;
      const chartWidth = this.canvasWidth - 100;
      const chartHeight = this.canvasHeight - 120;

      // Draw chart background
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(chartX, chartY, chartWidth, chartHeight);

      // Draw bars for video performance
      const videos = data.videos.slice(0, 10); // Top 10 videos
      const barWidth = chartWidth / videos.length;
      const maxViews = Math.max(...videos.map(v => v.views));

      videos.forEach((video, index) => {
        const barHeight = (video.views / maxViews) * chartHeight;
        const x = chartX + (index * barWidth);
        const y = chartY + chartHeight - barHeight;

        // Bar color based on performance
        const color = video.views > maxViews * 0.7 ? '#ff6b6b' : 
                     video.views > maxViews * 0.4 ? '#4ecdc4' : '#45b7d1';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 2, barHeight);

        // View count label
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          (video.views / 1000).toFixed(0) + 'k', 
          x + barWidth / 2, 
          y - 5
        );
      });

      // Save chart
      const buffer = canvas.toBuffer('image/png');
      const filename = `chart_${Date.now()}.png`;
      const filepath = path.join(__dirname, '../../temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filepath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      
      return filepath;
    } catch (error) {
      console.error('Error generating chart:', error);
      return null;
    }
  }

  // Generate engagement pie chart
  async generateEngagementChart(data) {
    try {
      const canvas = createCanvas(this.canvasWidth, this.canvasHeight);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Engagement Breakdown', this.canvasWidth / 2, 40);

      // Calculate totals
      const totalLikes = data.videos.reduce((sum, v) => sum + v.likes, 0);
      const totalComments = data.videos.reduce((sum, v) => sum + v.comments, 0);
      const totalShares = data.videos.reduce((sum, v) => sum + v.shares, 0);
      const total = totalLikes + totalComments + totalShares;

      // Draw pie chart
      const centerX = this.canvasWidth / 2;
      const centerY = this.canvasHeight / 2 + 20;
      const radius = 120;

      let currentAngle = 0;

      // Likes slice
      const likesAngle = (totalLikes / total) * 2 * Math.PI;
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + likesAngle);
      ctx.closePath();
      ctx.fill();
      currentAngle += likesAngle;

      // Comments slice
      const commentsAngle = (totalComments / total) * 2 * Math.PI;
      ctx.fillStyle = '#4ecdc4';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + commentsAngle);
      ctx.closePath();
      ctx.fill();
      currentAngle += commentsAngle;

      // Shares slice
      const sharesAngle = (totalShares / total) * 2 * Math.PI;
      ctx.fillStyle = '#45b7d1';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sharesAngle);
      ctx.closePath();
      ctx.fill();

      // Legend
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'left';
      
      ctx.fillStyle = '#ff6b6b';
      ctx.fillRect(50, this.canvasHeight - 80, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Likes: ${totalLikes.toLocaleString()}`, 80, this.canvasHeight - 68);
      
      ctx.fillStyle = '#4ecdc4';
      ctx.fillRect(250, this.canvasHeight - 80, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Comments: ${totalComments.toLocaleString()}`, 280, this.canvasHeight - 68);
      
      ctx.fillStyle = '#45b7d1';
      ctx.fillRect(450, this.canvasHeight - 80, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Shares: ${totalShares.toLocaleString()}`, 480, this.canvasHeight - 68);

      // Save chart
      const buffer = canvas.toBuffer('image/png');
      const filename = `engagement_${Date.now()}.png`;
      const filepath = path.join(__dirname, '../../temp', filename);
      
      // Ensure temp directory exists
      const tempDir = path.dirname(filepath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      fs.writeFileSync(filepath, buffer);
      
      return filepath;
    } catch (error) {
      console.error('Error generating engagement chart:', error);
      return null;
    }
  }

  // Clean up old chart files
  cleanup() {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        
        files.forEach(file => {
          const filepath = path.join(tempDir, file);
          const stats = fs.statSync(filepath);
          
          // Delete files older than 1 hour
          if (now - stats.mtime.getTime() > 3600000) {
            fs.unlinkSync(filepath);
          }
        });
      }
    } catch (error) {
      console.error('Error cleaning up chart files:', error);
    }
  }
}

module.exports = new ChartGenerator();
