export default interface MapTypeStyle {
  /**
   * The element to which a styler should be applied. An element is a visual
   * aspect of a feature on the map. Example: a label, an icon, the stroke or
   * fill applied to the geometry, and more. Optional. If
   * <code>elementType</code> is not specified, the value is assumed to be
   * <code>'all'</code>. For details of usage and allowed values, see the <a
   * href="https://developers.google.com/maps/documentation/javascript/style-reference#style-elements">style
   * reference</a>.
   */
  elementType?: string | null;
  /**
   * The feature, or group of features, to which a styler should be applied.
   * Optional. If <code>featureType</code> is not specified, the value is
   * assumed to be <code>'all'</code>. For details of usage and allowed
   * values, see the <a
   * href="https://developers.google.com/maps/documentation/javascript/style-reference#style-features">style
   * reference</a>.
   */
  featureType?: string | null;
  /**
   * The style rules to apply to the selected map features and elements. The
   * rules are applied in the order that you specify in this array. For
   * guidelines on usage and allowed values, see the <a
   * href="https://developers.google.com/maps/documentation/javascript/style-reference#stylers">style
   * reference</a>.
   */
  stylers: object[];
}
