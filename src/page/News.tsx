import Header from "../global/Header";
import Footer from "../global/Footer";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { loadAllNews, type NewsItem } from "../api/newsService";
import ReactMarkdown from "react-markdown";

export default function News() {
  const { t } = useLanguage();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        const news = await loadAllNews();
        setNewsItems(news);
        if (news.length > 0) setSelectedNews(news[0]);
      } catch {
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-[#070d1a]">
      <Header />

      <main className="flex-1 px-4 py-12">
        <div className="max-w-6xl mx-auto">

          <div className="mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-1">
              {t("header.news") || "News"}
            </h1>
            <p className="text-white/35 text-sm">
              {t("common.newsDescription") || "Latest updates and announcements"}
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-20 text-white/50">{error}</div>
          )}

          {!loading && !error && newsItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 뉴스 리스트 */}
              <div className="lg:col-span-1">
                <p className="text-xs font-bold text-white/35 uppercase tracking-widest mb-4">
                  {t("common.articles") || "Articles"}
                </p>
                <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                  {newsItems.map((news) => (
                    <button
                      key={news.id}
                      onClick={() => setSelectedNews(news)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedNews?.id === news.id
                          ? "bg-white/10 border-white/25 text-white"
                          : "bg-white/[0.03] border-white/8 text-white/60 hover:bg-white/6 hover:text-white/80"
                      }`}
                    >
                      <p className="font-semibold text-sm truncate leading-snug">
                        {news.title}
                      </p>
                      <p className="text-xs text-white/30 mt-1">{news.date}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 뉴스 상세 */}
              <div className="lg:col-span-2">
                {selectedNews ? (
                  <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-8">
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <h1 className="text-2xl font-black text-white mb-2 leading-tight">
                        {selectedNews.title}
                      </h1>
                      <p className="text-white/35 text-sm">{selectedNews.date}</p>
                    </div>

                    <div className="prose-dark text-white/75 leading-relaxed text-sm">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }: any) => (
                            <h2 className="text-xl font-bold text-white mt-6 mb-3">{children}</h2>
                          ),
                          h2: ({ children }: any) => (
                            <h3 className="text-lg font-bold text-white mt-5 mb-2">{children}</h3>
                          ),
                          h3: ({ children }: any) => (
                            <h4 className="text-base font-semibold text-white/90 mt-4 mb-2">{children}</h4>
                          ),
                          p: ({ children }: any) => (
                            <p className="mb-3 text-white/70 leading-relaxed">{children}</p>
                          ),
                          ul: ({ children }: any) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-white/70">{children}</ul>
                          ),
                          li: ({ children }: any) => <li className="ml-2">{children}</li>,
                          strong: ({ children }: any) => (
                            <strong className="font-bold text-white">{children}</strong>
                          ),
                          em: ({ children }: any) => (
                            <em className="italic text-white/60">{children}</em>
                          ),
                          code: ({ children }: any) => (
                            <code className="bg-white/10 px-2 py-0.5 rounded text-sm font-mono text-white/80">
                              {children}
                            </code>
                          ),
                          blockquote: ({ children }: any) => (
                            <blockquote className="pl-4 py-2 border-l-4 border-[#2F639D] bg-[#2F639D]/10 italic text-white/60 my-4 rounded-r">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {selectedNews.body}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 text-white/35">
                    <p>{t("common.noData") || "No news selected"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !error && newsItems.length === 0 && (
            <div className="text-center py-20 text-white/35">
              {t("common.noData") || "No news available"}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
