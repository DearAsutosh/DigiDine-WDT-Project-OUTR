// Static Data & Entry point for Backend Integration
const DB = {
    // This will be populated from the API
    restaurants: [],
    
    /**
     * Replaces local static data with backend data
     * This keeps the rest of the application working with minimal changes.
     */
    init: async function() {
        try {
            this.restaurants = await ApiClient.getRestaurants();
            console.log("Restaurants loaded from backend");
            return true;
        } catch (error) {
            console.error("Failed to load restaurants from API, using fallback or empty state.");
            return false;
        }
    }
};
