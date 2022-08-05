import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import React from "react";
import { createRoot } from 'react-dom/client';

import App from "./App";
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('app');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript


const themeLight = createTheme({
  typography: {
    fontFamily: [
      'Chilanka',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
      'Chilanka'
    ].join(','),
  },
  components :{
    MuiButton : {
      styleOverrides : {
        root : {
          height : "fit-content",
          margin: "20px",
          textTransform: "none",
          fontWeight : "bolder"
        }
      }
    },
    MuiChip : {
      styleOverrides : {
        root : {
          fontWeight: "bolder",
          margin: "20px",
          border: "1px solid white" ,
          height: "38px"
        },
        avatarColorPrimary : {
          backgroundColor : "black"
        }
      }
    } 
  },
  palette: {
    primary: {
      main : "#ffffff"
    },
    secondary: {
      main : "#0E1E2E"
    },
  }
});

root.render(
  <React.StrictMode>
    <SnackbarProvider maxSnack={3}>
    <ThemeProvider theme={themeLight}>
    <App />
    </ThemeProvider>
    </SnackbarProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
