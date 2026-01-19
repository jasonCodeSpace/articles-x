import { ImageResponse } from 'next/og'
import { OG_CONFIG } from '@/lib/og-config'
import { XArticleLogo } from '@/lib/og-logo'

export const runtime = 'edge'

export const alt = 'Xarticle - Curated Articles from X'
export const size = {
    width: OG_CONFIG.width,
    height: OG_CONFIG.height,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: OG_CONFIG.colors.paper,
                    padding: '80px',
                    fontFamily: 'serif',
                    position: 'relative',
                }}
            >
                {/* Sketchy Background Border */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '40px',
                        border: `1px solid ${OG_CONFIG.colors.ink}`,
                        opacity: 0.15,
                        borderRadius: '60px 20px 80px 30px',
                        zIndex: 0,
                    }}
                />

                {/* Central Minimalist Brand */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <div style={{ marginBottom: 48, opacity: 0.9 }}>
                        <XArticleLogo width={120} height={120} />
                    </div>

                    <h1 style={{
                        fontSize: 96,
                        fontWeight: 400,
                        color: OG_CONFIG.colors.ink,
                        fontFamily: OG_CONFIG.fonts.serif,
                        margin: 0,
                        lineHeight: 1,
                        letterSpacing: '-0.04em'
                    }}>
                        Xarticle
                    </h1>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: 32,
                        color: OG_CONFIG.colors.forestGreen,
                        opacity: 0.7
                    }}>
                        <div style={{ width: 40, height: '1px', backgroundColor: OG_CONFIG.colors.forestGreen, opacity: 0.3 }} />
                        <p style={{
                            fontSize: 24,
                            margin: '0 20px',
                            fontWeight: 500,
                            fontFamily: OG_CONFIG.fonts.sans,
                            letterSpacing: '0.05em',
                            textTransform: 'lowercase'
                        }}>
                            curated for the mindful reader
                        </p>
                        <div style={{ width: 40, height: '1px', backgroundColor: OG_CONFIG.colors.forestGreen, opacity: 0.3 }} />
                    </div>
                </div>

                {/* Floating Minimalist Keywords - Small and Sketchy */}
                <div style={{
                    display: 'flex',
                    position: 'absolute',
                    bottom: 120,
                    gap: 60,
                    opacity: 0.4,
                    fontSize: 16,
                    fontWeight: 400,
                    color: OG_CONFIG.colors.ink,
                    fontFamily: OG_CONFIG.fonts.sans,
                    zIndex: 10
                }}>
                    <span>✦ Summaries</span>
                    <span>✦ Insights</span>
                    <span>✦ Daily</span>
                </div>

                {/* Web URL - Discrete */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: 60,
                        fontSize: 16,
                        color: OG_CONFIG.colors.forestGreen,
                        letterSpacing: '0.3em',
                        fontWeight: 600,
                        zIndex: 10,
                        opacity: 0.5
                    }}
                >
                    WWW.XARTICLE.NEWS
                </div>

                {/* Hand-drawn Leaf/Organic Element SVG */}
                <div style={{ position: 'absolute', top: 80, left: 100, opacity: 0.08, transform: 'rotate(-15deg)' }}>
                    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M30 75C30 75 10 50 10 30C10 10 30 5 30 5C30 5 50 10 50 30C50 50 30 75 30 75Z" stroke={OG_CONFIG.colors.ink} strokeWidth="1.5" />
                        <path d="M30 75V5" stroke={OG_CONFIG.colors.ink} strokeWidth="1.5" />
                        <path d="M10 30C10 30 20 25 30 30" stroke={OG_CONFIG.colors.ink} strokeWidth="1" strokeDasharray="2 2" />
                        <path d="M50 30C50 30 40 25 30 30" stroke={OG_CONFIG.colors.ink} strokeWidth="1" strokeDasharray="2 2" />
                    </svg>
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
