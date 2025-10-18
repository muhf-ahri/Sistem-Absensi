import { useCallback } from "react";
import {
  showToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showConfirmation,
  showSuccessDialog,
  showErrorDialog,
  showLoading,
  closeAlert
} from "../utils/sweetAlert";

export const useSweetAlert = () => {
  const toast = useCallback((icon, title, timer) => {
    return showToast(icon, title, timer);
  }, []);

  const successToast = useCallback((title, timer) => {
    return showSuccessToast(title, timer);
  }, []);

  const errorToast = useCallback((title, timer) => {
    return showErrorToast(title, timer);
  }, []);

  const warningToast = useCallback((title, timer) => {
    return showWarningToast(title, timer);
  }, []);

  const infoToast = useCallback((title, timer) => {
    return showInfoToast(title, timer);
  }, []);

  const confirmation = useCallback((title, text, confirmButtonText, cancelButtonText) => {
    return showConfirmation(title, text, confirmButtonText, cancelButtonText);
  }, []);

  const successDialog = useCallback((title, text, confirmButtonText) => {
    return showSuccessDialog(title, text, confirmButtonText);
  }, []);

  const errorDialog = useCallback((title, text, confirmButtonText) => {
    return showErrorDialog(title, text, confirmButtonText);
  }, []);

  const loading = useCallback((title) => {
    return showLoading(title);
  }, []);

  const close = useCallback(() => {
    closeAlert();
  }, []);

  return {
    toast,
    successToast,
    errorToast,
    warningToast,
    infoToast,
    confirmation,
    successDialog,
    errorDialog,
    loading,
    close
  };
};