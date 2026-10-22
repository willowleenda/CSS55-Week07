// tell next.js this component runs on the client
"use client";

// import react and the useeffect hook (runs code when dependencies change)
import React, { useEffect } from "react";

// import link component for navigating between pages
import Link from "next/link";

// import firebase authentication functions
import {
  signInWithGoogle, // handle google sign-in
  signOut, // handle user sign-out
  onIdTokenChanged, // listen for authentication token changes
} from "@/src/lib/firebase/auth.js";

// import function that adds sample restaurants and reviews to firestore
import { addFakeRestaurantsAndReviews } from "@/src/lib/firebase/firestore.js";

// import functions for creating and deleting cookies
import { setCookie, deleteCookie } from "cookies-next";

// define a custom hook that manages the user's session
function useUserSession(initialUser) {
  // run effect to listen for authentication changes
  useEffect(() => {
    // listen for changes to user's authentication token
    return onIdTokenChanged(async (user) => {
      // check if a user is signed in
      if (user) {
        // get user's firebase authentication token
        const idToken = await user.getIdToken();

        // store token in a cookie for server authentication
        await setCookie("__session", idToken);
      } else {
        // delete session cookie when user signs out
        await deleteCookie("__session");
      }

      // check if initial and current user ids match
      if (initialUser?.uid === user?.uid) {
        // stop if the user has not changed
        return;
      }

      // reload page to update the user's session
      window.location.reload();
    }); // finish listening for authentication changes
  }, [initialUser]); // rerun the effect when the initial user changes

  // return initial user information
  return initialUser;
} // finish defining custom hook

// define header component and receive initial user
export default function Header({ initialUser }) {
  // get current user session
  const user = useUserSession(initialUser);

  // define function that handles signing out
  const handleSignOut = (event) => {
    // prevent link's default navigation
    event.preventDefault();

    // sign the user out
    signOut();
  }; // finish defining sign-out handler

  // define the function that handles signing in
  const handleSignIn = (event) => {
    // prevent the link's default navigation
    event.preventDefault();

    // start google sign-in
    signInWithGoogle();
  }; // finish defining sign-in handler

  // return header's user interface
  return (
    // create header containing the logo and account options
    <header>
      {/* link the logo to the home page */}
      <Link href="/" className="logo">
        {/* display the friendly eats logo */}
        <img src="/friendly-eats.svg" alt="FriendlyEats" />
        {/* display the site name */}
        Friendly Eats
      </Link>

      {/* show different content depending on whether the user is signed in */}
      {user ? (
        // display signed-in user's profile and menu
        <>
          {/* create the user's profile container */}
          <div className="profile">
            {/* display the user's profile information */}
            <p>
              {/* show the user's photo or the default profile image */}
              <img
                // apply profile image's css class
                className="profileImage"
                // use user's photo or the default image
                src={user.photoURL || "/profile.svg"}
                // use user's email as alternative text
                alt={user.email}
              />
              {/* display the user's name */}
              {user.displayName}
            </p>

            {/* create the user's dropdown menu */}
            <div className="menu">
              {/* display the menu indicator */}
              ...
              {/* create the menu options list */}
              <ul>
                {/* display the user's name in the menu */}
                <li>{user.displayName}</li>

                {/* create the sample restaurants menu option */}
                <li>
                  {/* add sample restaurants when clicked */}
                  <a href="#" onClick={addFakeRestaurantsAndReviews}>
                    Add sample restaurants
                  </a>
                </li>

                {/* create the sign-out menu option */}
                <li>
                  {/* sign the user out when clicked */}
                  <a href="#" onClick={handleSignOut}>
                    Sign Out
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        // display sign-in option when no user is signed in
        <div className="profile">
          {/* start google sign-in when clicked */}
          <a href="#" onClick={handleSignIn}>
            {/* display the default profile image */}
            <img src="/profile.svg" alt="A placeholder user image" />
            {/* display the sign-in option */}
            Sign In with Google
          </a>
        </div>
      )}
    </header>
  ); // finish returning the header interface
} // finish defining the header component