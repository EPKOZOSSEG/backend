import App from "./app";
import CargoController from "./controllers/cargo.conteroller";
import ItemController from "./controllers/item.controller";

new App([new CargoController(), new ItemController()]);  
