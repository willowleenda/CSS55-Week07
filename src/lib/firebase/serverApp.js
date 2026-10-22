// enforce that this code only runs on the server
// https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment
import "server-only";

// import function for accessing request cookies
import { cookies } from "next/headers";

// import functions for initializing firebase apps
import { initializeServerApp, initializeApp } from "firebase/app";

// import function for accessing firebase authentication
import { getAuth } from "firebase/auth";

// define asynchronous function that gets authenticated firebase app for current user
export async function getAuthenticatedAppForUser() {
  // get authentication token from session cookie
  const authIdToken = (await cookies()).get("__session")?.value;

  // initialize firebase server app using client authentication token
  const firebaseServerApp = initializeServerApp(
    // initialize or retrieve default firebase app instance
    // https://github.com/firebase/firebase-js-sdk/issues/8863#issuecomment-2751401913
    initializeApp(),
    {
      authIdToken, // pass authentication token to firebase server app
    }
  );

  // get authentication instance for server app
  const auth = getAuth(firebaseServerApp);

  // wait until firebase finishes checking authentication state
  await auth.authStateReady();

  // return server app and currently authenticated user
  return { firebaseServerApp, currentUser: auth.currentUser };
}