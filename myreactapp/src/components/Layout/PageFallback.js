import React from "react";
import Loader from "../Loader/Loader";

function PageFallback({ text }) {
  return (
    <div className="page-container">
      <Loader text={text} />
    </div>
  );
}

export default PageFallback;
