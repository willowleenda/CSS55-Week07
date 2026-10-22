"use client";

// This components shows one individual restaurant
// It receives data from src/app/restaurant/[id]/page.jsx

// import react and necessary hooks
import { React, useState, useEffect, Suspense } from "react";
// import next.js dynamic import for lazy loading components
import dynamic from "next/dynamic";
// import firestore function to listen for restaurant updates
import { getRestaurantSnapshotById } from "@/src/lib/firebase/firestore.js";
// import hook to get the current user
import { useUser } from "@/src/lib/getUser";
// import component to display restaurant details
import RestaurantDetails from "@/src/components/RestaurantDetails.jsx";
// import function to handle image uploads
import { updateRestaurantImage } from "@/src/lib/firebase/storage.js";

// dynamically import the review dialog component to save initial load time
const ReviewDialog = dynamic(() => import("@/src/components/ReviewDialog.jsx"));

// define the restaurant component with its props
export default function Restaurant({
  id, // restaurant id
  initialRestaurant, // initial data fetched on the server
  initialUserId, // initial user id from the server
  children, // child components (like reviews list)
}) {
  // state to hold the current restaurant details
  const [restaurantDetails, setRestaurantDetails] = useState(initialRestaurant);
  // state to control if the review dialog is open
  const [isOpen, setIsOpen] = useState(false);

  // The only reason this component needs to know the user ID is to associate a review with the user, and to know whether to show the review dialog
  // get the current user id from the auth hook, fallback to server id
  const userId = useUser()?.uid || initialUserId;
  // state to hold the new review being written
  const [review, setReview] = useState({
    rating: 0, // default rating
    text: "", // default text
  });

  // function to update the review state when the user types or picks a star
  const onChange = (value, name) => {
    // spread the existing review and update the specific field
    setReview({ ...review, [name]: value });
  };

  // function to handle when a user selects a new image to upload
  async function handleRestaurantImage(target) {
    // get the first file from the input
    const image = target.files ? target.files[0] : null;
    // if no image, do nothing
    if (!image) {
      return;
    }

    // upload the image and get the new url back
    const imageURL = await updateRestaurantImage(id, image);
    // update the local state with the new image url
    setRestaurantDetails({ ...restaurantDetails, photo: imageURL });
  }

  // function to close the dialog and reset the review form
  const handleClose = () => {
    // close the dialog
    setIsOpen(false);
    // reset the form fields
    setReview({ rating: 0, text: "" });
  };

  // effect to listen for real-time updates to this restaurant in firestore
  useEffect(() => {
    // subscribe to the snapshot and update state when data changes
    return getRestaurantSnapshotById(id, (data) => {
      setRestaurantDetails(data);
    });
  }, [id]); // re-run if the id changes

  // return the jsx for the restaurant page
  return (
    <>
      <RestaurantDetails
        restaurant={restaurantDetails} // pass down the live restaurant data
        userId={userId} // pass down the user id
        handleRestaurantImage={handleRestaurantImage} // pass down image upload handler
        setIsOpen={setIsOpen} // pass down function to open dialog
        isOpen={isOpen} // pass down dialog state
      >
        {children} {/* render any child components */}
      </RestaurantDetails>
      {/* only show the review dialog if the user is logged in */}
      {userId && (
        <Suspense fallback={<p>Loading...</p>}> {/* show loading state while dialog loads */}
          <ReviewDialog
            isOpen={isOpen} // pass dialog state
            handleClose={handleClose} // pass close handler
            review={review} // pass current review state
            onChange={onChange} // pass change handler
            userId={userId} // pass user id
            id={id} // pass restaurant id
          />
        </Suspense>
      )}
    </>
  );
}