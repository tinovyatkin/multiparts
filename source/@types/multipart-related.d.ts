declare module 'multipart-related/src/first-boundary-position.js' {
  export default function firstBoundaryPosition(
    data: Uint8Array,
    boundary: Uint8Array,
    offset = 0,
  ): number;
}

declare module 'multipart-related/src/first-header-separator-position.js' {
  export default function firstHeaderSeparatorPosition(
    data: Uint8Array,
    offset?: number,
  ): number;
}

declare module 'multipart-related/src/starts-with-boundary-end.js' {
  export default function startsWithBoundaryEnd(
    data: Uint8Array,
    boundary: Uint8Array,
    offset?: number,
  ): boolean;
}
