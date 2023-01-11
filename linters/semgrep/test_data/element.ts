/* eslint-disable react/jsx-props-no-spreading */
import React, { ReactElement } from "react";

export default function Bad(): ReactElement {
  return <div dangerouslySetInnerHTML="DANGER" />;
}
