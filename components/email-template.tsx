import React from 'react';

interface EmailTemplateProps {
  dailySummary: {
    date: string;
    summary_content: string;
    top_article_title: string;
  };
  topArticles: Array<{
    id: string;
    title: string;
    author_name: string;
    view_count: number;
    category?: string;
  }>;
}

export const DailyEmailTemplate: React.FC<EmailTemplateProps> = ({
  dailySummary,
  topArticles
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Daily Article: {dailySummary.top_article_title}</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .logo {
            width: 60px;
            height: 60px;
            margin: 0 auto 20px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 40px 30px;
          }
          .summary-section {
            margin-bottom: 40px;
          }
          .summary-title {
            font-size: 22px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
          }
          .summary-content {
            font-size: 16px;
            line-height: 1.7;
            color: #475569;
            background-color: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .articles-section {
            margin-top: 40px;
          }
          .articles-title {
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
          }
          .article-item {
            background-color: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: all 0.2s ease;
          }
          .article-item:hover {
            border-color: #667eea;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.1);
          }
          .article-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            text-decoration: none;
          }
          .article-meta {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
            color: #64748b;
          }
          .article-author {
            font-weight: 500;
          }
          .article-views {
            background-color: #f1f5f9;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: 500;
          }
          .category-tag {
            background-color: #667eea;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .footer {
            background-color: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer-text {
            font-size: 14px;
            color: #64748b;
            margin: 0;
          }
          .footer-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
          }
          .footer-link:hover {
            text-decoration: underline;
          }
          .divider {
            height: 1px;
            background-color: #e2e8f0;
            margin: 30px 0;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="header">
            <div className="logo">X</div>
            <h1>Daily Article Summary</h1>
            <p>{formatDate(dailySummary.date)}</p>
          </div>

          {/* Content */}
          <div className="content">
            {/* Daily Summary */}
            <div className="summary-section">
              <h2 className="summary-title">Today's Highlights</h2>
              <div className="summary-content">
                {dailySummary.summary_content}
              </div>
            </div>

            <div className="divider"></div>

            {/* Top Articles */}
            <div className="articles-section">
              <h2 className="articles-title">📈 Trending Articles</h2>
              {topArticles.map((article, index) => (
                <div key={article.id} className="article-item">
                  <div className="article-title">
                    #{index + 1} {article.title}
                  </div>
                  <div className="article-meta">
                    <div>
                      <span className="article-author">by {article.author_name}</span>
                      {article.category && (
                        <span className="category-tag" style={{ marginLeft: '10px' }}>
                          {article.category}
                        </span>
                      )}
                    </div>
                    <div className="article-views">
                      👁 {article.view_count.toLocaleString()} views
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <p className="footer-text">
              You're receiving this because you subscribed to Xarticle daily summaries.
              <br />
              <a href="https://xarticle.news" className="footer-link">Visit Xarticle</a> |
              <a href="https://xarticle.news/trending" className="footer-link">View Trending</a>
            </p>
            <p className="footer-text" style={{ marginTop: '15px', fontSize: '12px' }}>
              © 2024 Xarticle. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

export default DailyEmailTemplate;