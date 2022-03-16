import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import reportWebVitals from './reportWebVitals';

const themeLight = createTheme({
  palette: {
    primary: {
      main : "#eb3448"
    },
    secondary: {
      main : "#ff8600"
    }
  }
});

ReactDOM.render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3}>
    <ThemeProvider theme={themeLight}>
    <App />
    </ThemeProvider>
    </SnackbarProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
