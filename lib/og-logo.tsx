import React from 'react'

export function XArticleLogo({ width = 1400, height = 1400, style = {} }: { width?: number | string, height?: number | string, style?: React.CSSProperties }) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 1400 1400"
            xmlns="http://www.w3.org/2000/svg"
            style={style}
        >
            <defs>
                <clipPath id="clipTop">
                    <rect x="0" y="0" width="1400" height="700.0" />
                </clipPath>
            </defs>

            {/* Bottom layer: all arms in cream */}
            <rect x="190.00" y="620.00" width="1020.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(0 700.0 700.0)" fill="#F2ECE1" />
            <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(45 700.0 700.0)" fill="#F2ECE1" />
            <rect x="230.00" y="620.00" width="940.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(90 700.0 700.0)" fill="#F2ECE1" />
            <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(135 700.0 700.0)" fill="#F2ECE1" />
            <rect x="190.00" y="620.00" width="1020.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(180 700.0 700.0)" fill="#F2ECE1" />
            <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(225 700.0 700.0)" fill="#F2ECE1" />
            <rect x="230.00" y="620.00" width="940.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(270 700.0 700.0)" fill="#F2ECE1" />
            <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(315 700.0 700.0)" fill="#F2ECE1" />

            {/* Top overlay: all arms in green, clipped to top half */}
            <g clipPath="url(#clipTop)">
                <rect x="190.00" y="620.00" width="1020.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(0 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(45 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="230.00" y="620.00" width="940.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(90 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(135 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="190.00" y="620.00" width="1020.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(180 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(225 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="230.00" y="620.00" width="940.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(270 700.0 700.0)" fill="#2F6F50" />
            </g>
            <g clipPath="url(#clipTop)">
                <rect x="210.00" y="620.00" width="980.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(315 700.0 700.0)" fill="#2F6F50" />
            </g>

            {/* Final pass: center horizontal arm fully green */}
            <rect x="190.00" y="620.00" width="1020.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(0 700.0 700.0)" fill="#2F6F50" />
            <rect x="190.00" y="620.00" width="1020.00" height="160.00" rx="35.00" ry="35.00" transform="rotate(180 700.0 700.0)" fill="#2F6F50" />
        </svg>
    )
}
