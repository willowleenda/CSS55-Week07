// import google authentication provider and sign-in functions from firebase
import {
  GoogleAuthProvider, // provide google authentication
  signInWithPopup, // open popup for signing in
  onAuthStateChanged as _onAuthStateChanged, // listen for sign-in state changes
  onIdTokenChanged as _onIdTokenChanged, // listen for authentication token changes
} from "firebase/auth";

// import firebase authentication instance
import { auth } from "@/src/lib/firebase/clientApp";

// define function that listens for authentication state changes
export function onAuthStateChanged(cb) {
  // register callback with firebase authentication
  return _onAuthStateChanged(auth, cb);
}

// define function that listens for authentication token changes
export function onIdTokenChanged(cb) {
  // register callback for token changes
  return _onIdTokenChanged(auth, cb);
}

// define asynchronous function that signs in with google
export async function signInWithGoogle() {
  // create google authentication provider
  const provider = new GoogleAuthProvider();

  // attempt google sign-in
  try {
    // open google sign-in popup and wait for authentication
    await signInWithPopup(auth, provider);
  } catch (error) {
    // log error if google sign-in fails
    console.error("Error signing in with Google", error);
  }
}

// define asynchronous function that signs user out
export async function signOut() {
  // attempt to sign out
  try {
    // return firebase sign-out result
    return auth.signOut();
  } catch (error) {
    // log error if sign-out fails
    console.error("Error signing out with Google", error);
  }
}