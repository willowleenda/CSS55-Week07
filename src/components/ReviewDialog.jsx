"use client";

// This components handles the review dialog and uses a next.js feature known as Server Actions to handle the form submission

// import react hooks for side effects, layout effects, and dom references
import { useEffect, useLayoutEffect, useRef } from "react";
// import the rating picker component
import RatingPicker from "@/src/components/RatingPicker.jsx";
// import the server action to handle the form submission
import { handleReviewFormSubmission } from "@/src/app/actions.js";

// define the review dialog component with its props
const ReviewDialog = ({
  isOpen, // boolean to control if the dialog is visible
  handleClose, // function to close the dialog
  review, // object holding the current review text
  onChange, // function to handle changes in the text input
  userId, // the id of the current user
  id, // the id of the restaurant
}) => {
  // create a ref to attach to the dialog element
  const dialog = useRef();

  // dialogs only render their backdrop when called with `showModal`
  // use layout effect to show or hide the dialog based on the isopen prop
  useLayoutEffect(() => {
    // if isopen is true
    if (isOpen) {
      // open the dialog as a modal
      dialog.current.showModal();
    } else {
      // otherwise close the dialog
      dialog.current.close();
    }
  }, [isOpen, dialog]); // run this effect when isopen or dialog changes

  // function to handle clicks on the dialog
  const handleClick = (e) => {
    // close if clicked outside the modal
    // check if the click target is the dialog backdrop itself
    if (e.target === dialog.current) {
      // call the close handler
      handleClose();
    }
  };

  // return the jsx for the dialog
  return (
    <dialog ref={dialog} onMouseDown={handleClick}>
      <form
        action={handleReviewFormSubmission} // connect form to the server action
        onSubmit={() => { // handle client-side submit
          handleClose(); // close the dialog when submitted
        }}
      >
        <header>
          <h3>Add your review</h3>
        </header>
        <article>
          <RatingPicker /> {/* render the star rating component */}

          <p>
            <input
              type="text"
              name="text"
              id="review"
              placeholder="Write your thoughts here"
              required
              value={review.text} // bind the input value to the review state
              onChange={(e) => onChange(e.target.value, "text")} // update state when user types
            />
          </p>

          {/* hidden inputs to pass data with the form submission */}
          <input type="hidden" name="restaurantId" value={id} />
          <input type="hidden" name="userId" value={userId} />
        </article>
        <footer>
          <menu>
            <button
              autoFocus
              type="reset"
              onClick={handleClose}
              className="button--cancel"
            >
              Cancel
            </button>
            <button type="submit" value="confirm" className="button--confirm">
              Submit
            </button>
          </menu>
        </footer>
      </form>
    </dialog>
  );
};

// export the component
export default ReviewDialog;