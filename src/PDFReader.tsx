import React, { useState, useRef, useEffect, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "./PDFViewer.scss";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

interface PDFViewerProps {
  pdfSource: string;
  downloadFileName?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfSource,
  downloadFileName,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [prevScrollY, setPrevScrollY] = useState<number>(0);

  const downloadFileFromURL = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;

    link.style.display = "none";
    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      scrollToPage(currentPage - 1);
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < numPages) {
      scrollToPage(currentPage + 1);
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, numPages]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleScroll = (event: WheelEvent) => {
      const deltaY = event.deltaY;
      if (deltaY > 0 && prevScrollY <= viewer.scrollTop) {
        goToNextPage();
      } else if (deltaY < 0 && prevScrollY >= viewer.scrollTop) {
        goToPreviousPage();
      }
      setPrevScrollY(viewer.scrollTop);
    };

    viewer.addEventListener("wheel", handleScroll);
    return () => {
      viewer.removeEventListener("wheel", handleScroll);
    };
  }, [prevScrollY, goToNextPage, goToPreviousPage]);

  const scrollToPage = (page: number) => {
    const pageContainer = viewerRef.current?.querySelector<HTMLDivElement>(
      `[data-page="${page}"]`
    );
    if (pageContainer) {
      viewerRef.current?.scrollTo({
        top: pageContainer.offsetTop,
        behavior: "smooth",
      });
    }
  };

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div
      className="pdf-viewer"
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{ flexGrow: 1, marginBottom: "1rem", overflowY: "scroll" }}
        ref={viewerRef}
      >
        <Document file={pdfSource} onLoadSuccess={handleDocumentLoadSuccess}>
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_container_${index + 1}`}
              style={{
                border: "1px solid gray",
                marginBottom: "1rem",
                padding: "0.5rem",
              }}
              data-page={index + 1}
            >
              <Page
                renderTextLayer={false}
                renderAnnotationLayer={false}
                key={`page_${index + 1}`}
                pageNumber={index + 1}
              />
            </div>
          ))}
        </Document>
      </div>
      <div className="page-controls">
        {currentPage !== 1 && (
          <button onClick={goToPreviousPage}>Anterior</button>
        )}
        {currentPage !== numPages && (
          <button onClick={goToNextPage}>Siguiente</button>
        )}
        <div>
          Página {currentPage} de {numPages}
        </div>
        <div>
          {downloadFileName && (
            <div>
              <button
                onClick={(e) => {
                  e.preventDefault();

                  downloadFileFromURL(pdfSource, downloadFileName);
                }}
              >
                Descargar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
