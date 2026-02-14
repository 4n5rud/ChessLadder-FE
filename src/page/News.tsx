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
        if (news.length > 0) {
          setSelectedNews(news[0]);
        }
      } catch (err) {
        setError(t("common.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [t]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 px-4 py-12 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* 타이틀 */}
          <div className="mb-12">
            <h1 className="text-5xl font-black text-gray-900 mb-2 tracking-tight">
              {t("header.news") || "News"}
            </h1>
            <p className="text-gray-500 text-lg">
              {t("common.newsDescription") || "Latest updates and announcements"}
            </p>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-4 border-[#2F639D] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500">{t("common.loading") || "Loading..."}</p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center text-red-500">
                <p className="text-lg font-semibold">{error}</p>
              </div>
            </div>
          )}

          {/* 뉴스 콘텐츠 */}
          {!loading && !error && newsItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 뉴스 리스트 (왼쪽) */}
              <div className="lg:col-span-1 space-y-2">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {t("common.articles") || "Articles"}
                </h2>
                <div className="space-y-2 max-h-screen overflow-y-auto">
                  {newsItems.map((news) => (
                    <button
                      key={news.id}
                      onClick={() => setSelectedNews(news)}
                      className={`w-full text-left p-4 rounded-lg transition-all ${
                        selectedNews?.id === news.id
                          ? "bg-blue-100 border-2 border-blue-600 shadow-md"
                          : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <p className="font-semibold text-gray-900 truncate">
                        {news.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(news.date).toLocaleDateString("ko-KR")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 뉴스 상세 내용 (오른쪽) */}
              <div className="lg:col-span-2">
                {selectedNews ? (
                  <div className="bg-white rounded-xl border-2 border-gray-200 p-8 shadow-sm">
                    {/* 헤더 */}
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <h1 className="text-3xl font-black text-gray-900 mb-2">
                        {selectedNews.title}
                      </h1>
                      <p className="text-gray-500 text-sm">
                        {new Date(selectedNews.date).toLocaleDateString(
                          "ko-KR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>

                    {/* 마크다운 콘텐츠 */}
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }: any) => (
                            <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                              {children}
                            </h2>
                          ),
                          h2: ({ children }: any) => (
                            <h3 className="text-xl font-bold text-gray-900 mt-5 mb-2">
                              {children}
                            </h3>
                          ),
                          h3: ({ children }: any) => (
                            <h4 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
                              {children}
                            </h4>
                          ),
                          p: ({ children }: any) => (
                            <p className="mb-3 text-gray-700 leading-relaxed">
                              {children}
                            </p>
                          ),
                          ul: ({ children }: any) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700">
                              {children}
                            </ul>
                          ),
                          li: ({ children }: any) => (
                            <li className="ml-2">{children}</li>
                          ),
                          strong: ({ children }: any) => (
                            <strong className="font-bold text-gray-900">
                              {children}
                            </strong>
                          ),
                          em: ({ children }: any) => (
                            <em className="italic text-gray-700">
                              {children}
                            </em>
                          ),
                          code: ({ children }: any) => (
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
                              {children}
                            </code>
                          ),
                          blockquote: ({ children }: any) => (
                            <blockquote className="pl-4 py-2 border-l-4 border-blue-500 bg-blue-50 italic text-gray-700 my-4">
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
                  <div className="flex items-center justify-center py-20 text-gray-500">
                    <p>{t("common.noData") || "No news selected"}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 뉴스 없음 */}
          {!loading && !error && newsItems.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-600">
                {t("common.noData") || "No news available"}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
