import { Router } from "express";
import { isAuth } from "middleware/isAuth";
import validate from "middleware/validator";
import fileParser from "middleware/fileParser";
import { newProductSchema } from "utils/validationSchema";
import { deleteProduct, deleteProductImage, getLatestProducts, getProductByCategory, getProductDetails, getProductListings, listNewProduct, searchProducts, updateProduct } from "controllers/product";


const productRouter = Router();

productRouter.post("/list", isAuth, fileParser, validate(newProductSchema), listNewProduct);
productRouter.patch("/:id", isAuth, fileParser, validate(newProductSchema), updateProduct);
productRouter.delete("/:id", isAuth, deleteProduct);
productRouter.delete("/image/:productId/:imageId", isAuth, deleteProductImage);
productRouter.get("/details/:id", getProductDetails);
productRouter.get("/by-category/:category", getProductByCategory);
productRouter.get("/latest", getLatestProducts);
productRouter.get("/listings", isAuth, getProductListings);
productRouter.get("/search", isAuth, searchProducts)

export default productRouter;