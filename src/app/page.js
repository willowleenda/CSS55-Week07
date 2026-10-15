// import the restaurant listings component (displays the list of restaurants on the page)
import RestaurantListings from "@/src/components/RestaurantListings.jsx";

// import the function that retrieves restaurant data from firestore database
import { getRestaurants } from "@/src/lib/firebase/firestore.js";

// import the function that gets the firebase app configured for authenticated user
import { getAuthenticatedAppForUser } from "@/src/lib/firebase/serverApp.js";

// import the getFirestore function (provides access to firestore database)
import { getFirestore } from "firebase/firestore";

// force next.js to treat this route as server-side rendered
// without this line, during the build process, next.js will treat this route as static and build a static html file for it

// tell next.js to generate this page dynamically on the server instead of treating it as a static page
export const dynamic = "force-dynamic";

// this line also forces this route to be server-side rendered
// export const revalidate = 0; // this would set the page's revalidation interval to zero, preventing next.js from reusing a cached page

// define the home page component as asynchronous function, allowing it to wait for data to load
export default async function Home(props) {
  // get the search parameters from the page's props (may contain filters or sorting options from url)
  const searchParams = await props.searchParams;

  // using searchparams allows the filtering to happen on the server-side

  // get the firebase app configured for authenticated user and wait for the result
  const { firebaseServerApp } = await getAuthenticatedAppForUser();

  // retrieve restaurant data by passing firestore database connection and search parameters to the getrestaurants function
  const restaurants = await getRestaurants(
    // get firestore database instance from authenticated firebase app and pass it as the first argument
    getFirestore(firebaseServerApp),
    // pass the search parameters as the second argument so the restaurant results can be filtered or sorted
    searchParams
  ); // finish the restaurant retrieval call and store the results in the restaurants variable

  // return the page's user interface so next.js can render it
  return (
    // creates the main html element that wraps the main content of the home page and applies its css class
    <main className="main__home">
      {/* displays the restaurant listings component and passes the restaurant data and search parameters into it */}
      <RestaurantListings
        // passes the retrieved restaurant data to the component as its initial list of restaurants
        initialRestaurants={restaurants}
        // passes the current search parameters to the component so it can use the active filters or sorting options
        searchParams={searchParams}
      /> {/* closes the restaurant listings component */}
    </main>
  ); // finishes returning the page's user interface
}