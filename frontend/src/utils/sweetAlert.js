import Swal from "sweetalert2";

// Toast Notification
export const showToast = (icon, title, timer = 3000) => {
  return Swal.fire({
    icon,
    title,
    timer,
    timerProgressBar: true,
    showConfirmButton: false,
    position: "top-end",
    toast: true,
    background: "#fff",
    customClass: {
      popup: "sweet-alert-popup"
    }
  });
};

// Success Toast
export const showSuccessToast = (title, timer = 3000) => {
  return showToast("success", title, timer);
};

// Error Toast
export const showErrorToast = (title, timer = 3000) => {
  return showToast("error", title, timer);
};

// Warning Toast
export const showWarningToast = (title, timer = 3000) => {
  return showToast("warning", title, timer);
};

// Info Toast
export const showInfoToast = (title, timer = 3000) => {
  return showToast("info", title, timer);
};

// Confirmation Dialog
export const showConfirmation = (title, text, confirmButtonText = "Ya", cancelButtonText = "Batal") => {
  return Swal.fire({
    title,
    text,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  });
};

// Success Dialog
export const showSuccessDialog = (title, text, confirmButtonText = "OK") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: "#3085d6",
    confirmButtonText
  });
};

// Error Dialog
export const showErrorDialog = (title, text, confirmButtonText = "OK") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: "#3085d6",
    confirmButtonText
  });
};

// Loading Dialog
export const showLoading = (title = "Memproses...") => {
  return Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close any open dialog
export const closeAlert = () => {
  Swal.close();
};

export default Swal;