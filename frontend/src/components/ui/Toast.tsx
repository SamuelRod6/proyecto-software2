import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const Toast = () => (
   <ToastContainer 
	   position='top-center'
	   autoClose={3000} 
	   hideProgressBar={false} 
	   newestOnTop 
	   closeOnClick 
	   pauseOnFocusLoss 
	   draggable 
	   pauseOnHover 
	   theme='dark'
   />
);

export default Toast;
