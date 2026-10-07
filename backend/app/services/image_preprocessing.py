from app.services.document_preprocessor import document_preprocessor, DocumentPreprocessor

class ImagePreprocessor:
    def process(self, image_path: str) -> str:
        result = document_preprocessor.process_document(image_path)
        return result["primary_image_path"]

image_preprocessor = ImagePreprocessor()