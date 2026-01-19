import { ImageResponse } from 'next/og'
import { getArticleBySlug } from '@/lib/articles'
import { OG_CONFIG } from '@/lib/og-config'
import { XArticleLogo } from '@/lib/og-logo'

export const runtime = 'edge'

export const alt = 'Article OpenGraph Image'
export const size = {
    width: OG_CONFIG.width,
    height: OG_CONFIG.height,
}

export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
    const { slug } = await params
    const article = await getArticleBySlug(slug)

    if (!article) {
        return new ImageResponse(
            (
                <div
                    style={{
                        fontSize: 48,
                        background: OG_CONFIG.colors.paper,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: OG_CONFIG.colors.ink,
                    }}
                >
                    <XArticleLogo width={120} height={120} />
                    <div style={{ marginTop: 20 }}>Xarticle</div>
                </div>
            ),
            { ...size }
        )
    }

    const title = article.title_english || article.title
    const authorName = article.author_name

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    backgroundColor: OG_CONFIG.colors.paper,
                    padding: '80px 100px',
                    fontFamily: 'serif',
                    position: 'relative',
                }}
            >
                {/* Sketchy Decorative Frame */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '30px',
                        border: `1.5px solid ${OG_CONFIG.colors.ink}`,
                        opacity: 0.3,
                        borderRadius: '20px 40px 15px 35px', // Irregular hand-drawn look
                        zIndex: 0,
                    }}
                />

                {/* Brand Logo - Top Corner */}
                <div style={{ position: 'absolute', top: 60, right: 80, display: 'flex', zIndex: 10 }}>
                    <XArticleLogo width={64} height={64} />
                </div>

                {/* Content Section */}
                <div style={{ display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                    {/* Author Label */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 32,
                        color: OG_CONFIG.colors.forestGreen,
                        fontSize: 18,
                        fontWeight: 500,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase'
                    }}>
                        <span style={{ marginRight: 12 }}>Written by</span>
                        <span style={{ color: OG_CONFIG.colors.ink, fontWeight: 700 }}>{authorName}</span>
                    </div>

                    {/* Title - Large Serif */}
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 600,
                            lineHeight: 1.15,
                            color: OG_CONFIG.colors.ink,
                            fontFamily: OG_CONFIG.fonts.serif,
                            maxWidth: '900px',
                            letterSpacing: '-0.02em',
                            marginBottom: 40,
                        }}
                    >
                        {title}
                    </div>

                    {/* Minimalist Sketchy Divider */}
                    <div style={{
                        width: '150px',
                        height: '2px',
                        backgroundColor: OG_CONFIG.colors.forestGreen,
                        opacity: 0.4,
                        borderRadius: '50%', // Makes it look a bit more "ink" like
                        transform: 'rotate(-1deg)'
                    }} />
                </div>

                {/* Footer Brand */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 60,
                        left: 100,
                        display: 'flex',
                        alignItems: 'center',
                        color: OG_CONFIG.colors.mutedInk,
                        fontSize: 18,
                        fontWeight: 400,
                        letterSpacing: '0.05em',
                        zIndex: 10,
                    }}
                >
                    <span style={{ fontFamily: OG_CONFIG.fonts.sans }}>Curated Long-form from X</span>
                    <span style={{ margin: '0 12px', opacity: 0.3 }}>|</span>
                    <span style={{ color: OG_CONFIG.colors.forestGreen, fontWeight: 600 }}>xarticle.news</span>
                </div>

                {/* Small "Hand-drawn" Open Book SVG Placeholder in corner */}
                <div style={{ position: 'absolute', bottom: 60, right: 80, opacity: 0.15, zIndex: 5 }}>
                    <svg width="120" height="90" viewBox="0 0 120 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 80C30 80 50 65 60 40C70 65 90 80 110 80" stroke={OG_CONFIG.colors.ink} strokeWidth="2" strokeLinecap="round" />
                        <path d="M60 40V10" stroke={OG_CONFIG.colors.ink} strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 80C10 60 25 15 60 10" stroke={OG_CONFIG.colors.ink} strokeWidth="2" strokeLinecap="round" />
                        <path d="M110 80C110 60 95 15 60 10" stroke={OG_CONFIG.colors.ink} strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
                    </svg>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
