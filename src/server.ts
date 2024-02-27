import App from "./app";
import PlaceController from "./controllers/place.controller";

import UserController from "./controllers/user.controller";

new App([new UserController(), new PlaceController(),]);  
