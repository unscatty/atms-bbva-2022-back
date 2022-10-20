import MapTypeStyle from '@interfaces/google-maps/map-type-style.interface';

export const stylesToQueryParam = (styles: MapTypeStyle[]) => {
  return styles
    .map(style => {
      const feature = `feature:${style.featureType}`;
      const element = `element:${style.elementType}`;

      const transformedStyles = style.stylers
        .map(styler => {
          return Object.entries(styler)
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
        })
        .join('|');

      return `style=${feature}|${element}|${transformedStyles}`;
    })
    .join('&');
};
