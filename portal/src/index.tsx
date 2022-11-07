import { ThemeProvider, createTheme } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import React from "react";
import { createRoot } from 'react-dom/client';

import App from "./App";
import reportWebVitals from './reportWebVitals';

const container = document.getElementById('app');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript


const themeLight = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
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
          background:"#D8464E",
          height : "fit-content",
          margin: "20px",
          textTransform: "none",
          fontWeight : "bolder",
          borderRadius:"0px",
          color : "#ffffff",
        },
        //containedWarning : {
        //  color : "#ffffff"
        //},
        containedSizeMedium : {
        },
        sizeMedium : {
        }
      }
    },
    MuiChip : {
      styleOverrides : {
        root : {
          fontWeight: "bolder",
          border: "1px solid white" ,
          height: "3em",
          color:"white",
          background:"#D8464E",
        },
        avatarColorPrimary : {
          backgroundColor : "black"
        },

      }
    },
    MuiInputBase : {
      styleOverrides : {
        root : {
          color : "#ffffff",
          backgroundColor : "#55606A",
          border : 0,
          fontWeight : "bolder",
          padding: "1em",
          height: "4em",
        }
      }
    },
    MuiInputAdornment : {
      styleOverrides : {
        root : {
          backgroundColor : "#55606A",
        }
      }
    },
    MuiInputLabel : {
      styleOverrides : {
        root : {
          color : "#ffffff",
          fontWeight : "bolder",
          border : 0,
          transform: "translate(1em, 1em) scale(1)",
        },
        shrink : true,

      }
    },
    MuiOutlinedInput : {
      defaultProps : {
        notched : false,
      },
      styleOverrides : {
        root : {
        },
        input : {
          backgroundColor : "#55606A",
        }
      }
    },
    MuiSelect : {
      styleOverrides : {
        select : {
          background:"#D8464E",
          color:"ffffff",
          padding : 0,
        },
        standard : {
        },

      },
      defaultProps : {
        disableUnderline : true
      }

    },
    MuiInput : {
      styleOverrides : {
        root : {
          "&:before": {borderBottom : 0}
        }
      }
    },
    MuiTab : {
      styleOverrides : {
        fullWidth : true,
        labelIcon : {
          color : "#ffffff"
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
  warning : {
    main : "#D38700"
  },
  action : {
    disabled : "rgba(255, 255, 255, 0.26)",
    disabledBackground : "rgba(255, 255, 255, 0.1)"
  }
}
});

interface Props {
  children: React.ReactNode;
  breakpoint: string;
}
function displayBox( {children , breakpoint} : Props ){
  const display = {

  }
 return {}
}
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

