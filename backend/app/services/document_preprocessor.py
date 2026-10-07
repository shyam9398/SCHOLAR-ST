import os
import cv2
import numpy as np
from typing import Dict, Any, List

# PyMuPDF
# Newer versions expose the package as "pymupdf".
# Older versions commonly expose it as "fitz".
try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None


class DocumentPreprocessor:
    """
    Document Preprocessor for SCHOLAR-ST.

    Handles:
    - PDF → image conversion using PyMuPDF
    - High-resolution PDF rendering
    - Image preprocessing using OpenCV
    - Grayscale conversion
    - Deskewing
    - Denoising
    - CLAHE contrast enhancement
    - OCR-ready output

    Designed for:
    - ST certificates
    - Income certificates
    - Caste certificates
    - Marksheets
    - Scholarship documents
    - Fellowship documents
    """

    def __init__(self):
        pass

    # ---------------------------------------------------------
    # MAIN DOCUMENT PROCESSOR
    # ---------------------------------------------------------

    def process_document(self, file_path: str) -> Dict[str, Any]:
        """
        Process either an image or PDF document.

        Returns:
            {
                "primary_image_path": str,
                "all_page_image_paths": List[str],
                "is_pdf": bool,
                "total_pages": int,
                "width": int,
                "height": int
            }
        """

        if not os.path.exists(file_path):
            raise FileNotFoundError(
                f"File not found: {file_path}"
            )

        extension = os.path.splitext(file_path)[1].lower()

        if extension == ".pdf":
            return self._process_pdf(file_path)

        else:
            processed_path = self._process_image(file_path)

            image = cv2.imread(processed_path)

            if image is not None:
                height, width = image.shape[:2]
            else:
                height, width = 0, 0

            return {
                "primary_image_path": processed_path,
                "all_page_image_paths": [processed_path],
                "is_pdf": False,
                "total_pages": 1,
                "width": width,
                "height": height
            }

    # ---------------------------------------------------------
    # PDF PROCESSING
    # ---------------------------------------------------------

    def _process_pdf(self, pdf_path: str) -> Dict[str, Any]:
        """
        Convert PDF pages to high-resolution images
        and preprocess them using OpenCV.
        """

        # Check PyMuPDF
        if fitz is None:
            raise RuntimeError(
                "PyMuPDF is not installed. "
                "Install it using: python -m pip install PyMuPDF"
            )

        try:
            # Open PDF
            document = fitz.open(pdf_path)

        except Exception as error:
            raise RuntimeError(
                f"Unable to open PDF: {error}"
            ) from error

        try:
            total_pages = len(document)

            if total_pages == 0:
                raise ValueError(
                    f"PDF document is empty: {pdf_path}"
                )

            output_directory = os.path.dirname(pdf_path)

            base_name = os.path.splitext(
                os.path.basename(pdf_path)
            )[0]

            page_image_paths: List[str] = []

            # Process maximum first 3 pages
            pages_to_process = min(total_pages, 3)

            for page_index in range(pages_to_process):

                # Load PDF page
                page = document.load_page(page_index)

                # -------------------------------------------------
                # Render PDF at 300 DPI
                # -------------------------------------------------

                dpi = 300

                zoom = dpi / 72.0

                matrix = fitz.Matrix(
                    zoom,
                    zoom
                )

                pixmap = page.get_pixmap(
                    matrix=matrix,
                    alpha=False
                )

                # -------------------------------------------------
                # Convert PyMuPDF pixmap → NumPy
                # -------------------------------------------------

                image_data = np.frombuffer(
                    pixmap.samples,
                    dtype=np.uint8
                )

                image_data = image_data.reshape(
                    pixmap.height,
                    pixmap.width,
                    pixmap.n
                )

                # -------------------------------------------------
                # Convert to OpenCV BGR
                # -------------------------------------------------

                if pixmap.n == 3:

                    bgr_image = cv2.cvtColor(
                        image_data,
                        cv2.COLOR_RGB2BGR
                    )

                elif pixmap.n == 1:

                    bgr_image = cv2.cvtColor(
                        image_data,
                        cv2.COLOR_GRAY2BGR
                    )

                elif pixmap.n == 4:

                    bgr_image = cv2.cvtColor(
                        image_data,
                        cv2.COLOR_RGBA2BGR
                    )

                else:

                    bgr_image = image_data

                # -------------------------------------------------
                # OpenCV preprocessing
                # -------------------------------------------------

                enhanced_image = self._enhance_document_cv(
                    bgr_image
                )

                # -------------------------------------------------
                # Save processed page
                # -------------------------------------------------

                output_path = os.path.join(
                    output_directory,
                    f"{base_name}_p{page_index + 1}_processed.png"
                )

                success = cv2.imwrite(
                    output_path,
                    enhanced_image
                )

                if not success:
                    raise RuntimeError(
                        f"Failed to save processed page: {output_path}"
                    )

                page_image_paths.append(
                    output_path
                )

            # -----------------------------------------------------
            # Ensure at least one page was processed
            # -----------------------------------------------------

            if not page_image_paths:
                raise RuntimeError(
                    "No PDF pages were processed."
                )

            # First page is the primary image
            primary_image_path = page_image_paths[0]

            primary_image = cv2.imread(
                primary_image_path
            )

            if primary_image is not None:

                height, width = primary_image.shape[:2]

            else:

                width = 0
                height = 0

            return {
                "primary_image_path": primary_image_path,
                "all_page_image_paths": page_image_paths,
                "is_pdf": True,
                "total_pages": total_pages,
                "width": width,
                "height": height
            }

        finally:

            # Always close the PDF
            document.close()

    # ---------------------------------------------------------
    # IMAGE PROCESSING
    # ---------------------------------------------------------

    def _process_image(self, image_path: str) -> str:
        """
        Process a single image using OpenCV.
        """

        image = cv2.imread(
            image_path
        )

        if image is None:
            raise ValueError(
                f"Unable to read image: {image_path}"
            )

        # Enhance document
        enhanced_image = self._enhance_document_cv(
            image
        )

        directory = os.path.dirname(
            image_path
        )

        file_name = os.path.basename(
            image_path
        )

        name, _ = os.path.splitext(
            file_name
        )

        output_path = os.path.join(
            directory,
            f"{name}_processed.png"
        )

        success = cv2.imwrite(
            output_path,
            enhanced_image
        )

        if not success:
            raise RuntimeError(
                f"Failed to save processed image: {output_path}"
            )

        return output_path

    # ---------------------------------------------------------
    # OPENCV DOCUMENT ENHANCEMENT
    # ---------------------------------------------------------

    def _enhance_document_cv(
        self,
        image: np.ndarray
    ) -> np.ndarray:
        """
        OpenCV preprocessing pipeline.

        Steps:
        1. Resolution normalization
        2. Grayscale conversion
        3. Deskewing
        4. Denoising
        5. CLAHE contrast enhancement

        Output is OCR-ready grayscale image.
        """

        if image is None:
            raise ValueError(
                "Invalid image supplied for preprocessing."
            )

        # ---------------------------------------------------------
        # 1. Resolution normalization
        # ---------------------------------------------------------

        height, width = image.shape[:2]

        minimum_width = 1600

        if width < minimum_width:

            scale = minimum_width / float(width)

            new_width = int(
                width * scale
            )

            new_height = int(
                height * scale
            )

            image = cv2.resize(
                image,
                (
                    new_width,
                    new_height
                ),
                interpolation=cv2.INTER_CUBIC
            )

        # ---------------------------------------------------------
        # 2. Convert to grayscale
        # ---------------------------------------------------------

        if len(image.shape) == 3:

            gray = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2GRAY
            )

        else:

            gray = image.copy()

        # ---------------------------------------------------------
        # 3. Deskew
        # ---------------------------------------------------------

        try:

            # Otsu threshold
            _, threshold = cv2.threshold(
                gray,
                0,
                255,
                cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
            )

            coordinates = np.column_stack(
                np.where(threshold > 0)
            )

            if len(coordinates) > 100:

                angle = cv2.minAreaRect(
                    coordinates
                )[-1]

                # Normalize angle
                if angle < -45:

                    angle = -(90 + angle)

                elif angle > 45:

                    angle = 90 - angle

                else:

                    angle = -angle

                # Only rotate when meaningful tilt exists
                if 0.5 < abs(angle) < 15.0:

                    image_height, image_width = gray.shape[:2]

                    center = (
                        image_width // 2,
                        image_height // 2
                    )

                    rotation_matrix = cv2.getRotationMatrix2D(
                        center,
                        angle,
                        1.0
                    )

                    gray = cv2.warpAffine(
                        gray,
                        rotation_matrix,
                        (
                            image_width,
                            image_height
                        ),
                        flags=cv2.INTER_CUBIC,
                        borderMode=cv2.BORDER_REPLICATE
                    )

        except Exception:
            # If deskewing fails, continue without it
            pass

        # ---------------------------------------------------------
        # 4. Mild denoising
        # ---------------------------------------------------------

        denoised = cv2.fastNlMeansDenoising(
            gray,
            None,
            h=8,
            templateWindowSize=7,
            searchWindowSize=21
        )

        # ---------------------------------------------------------
        # 5. CLAHE contrast enhancement
        # ---------------------------------------------------------

        clahe = cv2.createCLAHE(
            clipLimit=2.2,
            tileGridSize=(8, 8)
        )

        enhanced = clahe.apply(
            denoised
        )

        return enhanced


# -------------------------------------------------------------
# GLOBAL INSTANCE
# -------------------------------------------------------------

document_preprocessor = DocumentPreprocessor()