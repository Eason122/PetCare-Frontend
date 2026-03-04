/// <reference types="@types/google.maps" />

/**
 * 擴展 Window 介面以支援 Google Maps API
 */
interface Window {
    google?: typeof google;
}
