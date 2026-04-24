import server from './server';

import environment from './common/constants/environment';

/******************************************************************************
                                Constants
******************************************************************************/

const SERVER_START_MESSAGE =
  'Express server started on port: ' + environment.API_PORT;

/******************************************************************************
                                  Run
******************************************************************************/

// Start the server
server.listen(environment.API_PORT, (err) => {
  if (!!err) {
    console.log("error", err)
  } else {
    console.log(SERVER_START_MESSAGE);
  }
});
