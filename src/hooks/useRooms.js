
import { useState, useEffect, useCallback } from 'react';

const initialRoomsData = [
  { id: 1, title: "Piso compartido luminoso en Malasaña", location: "Madrid", price: 550, rating: 4.8, amenities: ["wifi", "desk", "balcony", "air_conditioning", "washing_machine"], type: "Compartido", imageSlug: "Bright shared apartment living room with plants and sunlight", hostAvatar: "Host avatar for Ana G", hostName: "Ana G.", lifestyle: { party: 'no', pets: 'no', cleanliness: 'ordenado', smoking: 'no'}, rules: {gender: 'any', type: 'any'} },
  { id: 2, title: "Estudio con encanto en El Born", location: "Barcelona", price: 700, rating: 4.9, amenities: ["wifi", "kitchenette", "air_conditioning", "tv"], type: "Estudio", imageSlug: "Charming studio with exposed brick wall and cozy bed", hostAvatar: "Host avatar for Marc R", hostName: "Marc R.", lifestyle: { party: 'ocasional', pets: 'si', cleanliness: 'relajado', smoking: 'fuera'}, rules: {gender: 'any', type: 'any'} },
  { id: 3, title: "Habitación tranquila en Triana", location: "Sevilla", price: 400, rating: 4.7, amenities: ["wifi", "garden_access", "quiet_zone"], type: "Privada", imageSlug: "Peaceful room with a window overlooking a green courtyard", hostAvatar: "Host avatar for Sofia L", hostName: "Sofia L.", lifestyle: { party: 'no', pets: 'no', cleanliness: 'impecable', smoking: 'no'}, rules: {gender: 'chicas', type: 'estudiantes'} },
  { id: 4, title: "Ático con terraza y vistas al Turia", location: "Valencia", price: 850, rating: 4.9, amenities: ["wifi", "terrace", "kitchen", "bbq"], type: "Ático", imageSlug: "Modern penthouse terrace with outdoor seating and city views", hostAvatar: "Host avatar for David P", hostName: "David P.", lifestyle: { party: 'si', pets: 'si', cleanliness: 'ordenado', smoking: 'si'}, rules: {gender: 'any', type: 'any'} },
  { id: 5, title: "Habitación ideal para estudiantes (Realejo)", location: "Granada", price: 320, rating: 4.3, amenities: ["wifi", "desk", "shared_kitchen"], type: "Compartida", imageSlug: "Student room with a large desk and bookshelf full of books", hostAvatar: "Host avatar for Laura M", hostName: "Laura M.", lifestyle: { party: 'ocasional', pets: 'no', cleanliness: 'relajado', smoking: 'fuera'}, rules: {gender: 'any', type: 'estudiantes'} },
  { id: 6, title: "Loft de diseño en Indautxu", location: "Bilbao", price: 780, rating: 4.6, amenities: ["wifi", "kitchen", "open_plan", "smart_tv"], type: "Loft", imageSlug: "Stylish loft apartment with industrial design elements", hostAvatar: "Host avatar for Iker S", hostName: "Iker S.", lifestyle: { party: 'no', pets: 'no', cleanliness: 'ordenado', smoking: 'no'}, rules: {gender: 'any', type: 'profesionales'} },
];


const useRooms = () => {
  const [allRooms, setAllRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  
  const getInitialFilters = () => {
    const storedFilters = localStorage.getItem('roomFilters');
    if (storedFilters) {
      return JSON.parse(storedFilters);
    }
    return {
      searchTerm: "",
      priceRange: [0, 1500],
      selectedAmenities: [],
      selectedType: "all",
      lifestyleFilters: {
        party: 'any', // 'no', 'ocasional', 'si', 'any'
        pets: 'any', // 'no', 'si', 'any'
        cleanliness: 'any', // 'relajado', 'ordenado', 'impecable', 'any'
        smoking: 'any' // 'no', 'fuera', 'si', 'any'
      },
      rulesFilters: {
        gender: 'any', // 'chicas', 'chicos', 'mixto', 'any'
        type: 'any' // 'estudiantes', 'profesionales', 'any'
      }
    };
  };
  
  const [filters, setFilters] = useState(getInitialFilters);

  useEffect(() => {
    const storedRoomsData = JSON.parse(localStorage.getItem("roomsData"));
    if (storedRoomsData && storedRoomsData.length > 0) {
      setAllRooms(storedRoomsData);
    } else {
      setAllRooms(initialRoomsData);
      localStorage.setItem("roomsData", JSON.stringify(initialRoomsData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('roomFilters', JSON.stringify(filters));

    let tempRooms = allRooms;

    if (filters.searchTerm) {
      tempRooms = tempRooms.filter(room =>
        room.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        room.location.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    tempRooms = tempRooms.filter(room => room.price >= filters.priceRange[0] && room.price <= filters.priceRange[1]);

    if (filters.selectedAmenities.length > 0) {
      tempRooms = tempRooms.filter(room =>
        filters.selectedAmenities.every(amenity => room.amenities.includes(amenity))
      );
    }

    if (filters.selectedType !== "all") {
      tempRooms = tempRooms.filter(room => room.type === filters.selectedType);
    }

    Object.keys(filters.lifestyleFilters).forEach(key => {
        if (filters.lifestyleFilters[key] !== 'any') {
            tempRooms = tempRooms.filter(room => room.lifestyle && room.lifestyle[key] === filters.lifestyleFilters[key]);
        }
    });

    Object.keys(filters.rulesFilters).forEach(key => {
        if (filters.rulesFilters[key] !== 'any') {
            tempRooms = tempRooms.filter(room => room.rules && room.rules[key] === filters.rulesFilters[key]);
        }
    });


    setFilteredRooms(tempRooms);
  }, [filters, allRooms]);

  const updateSearchTerm = useCallback((term) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const updatePriceRange = useCallback((range) => {
    setFilters(prev => ({ ...prev, priceRange: range }));
  }, []);

  const toggleAmenity = useCallback((amenity) => {
    setFilters(prev => ({
      ...prev,
      selectedAmenities: prev.selectedAmenities.includes(amenity)
        ? prev.selectedAmenities.filter(a => a !== amenity)
        : [...prev.selectedAmenities, amenity]
    }));
  }, []);

  const updateSelectedType = useCallback((type) => {
    setFilters(prev => ({ ...prev, selectedType: type }));
  }, []);

  const updateLifestyleFilter = useCallback((filterName, value) => {
    setFilters(prev => ({
        ...prev,
        lifestyleFilters: { ...prev.lifestyleFilters, [filterName]: value }
    }));
  }, []);

  const updateRuleFilter = useCallback((filterName, value) => {
    setFilters(prev => ({
        ...prev,
        rulesFilters: { ...prev.rulesFilters, [filterName]: value }
    }));
  }, []);

  const resetFilters = useCallback(() => {
    const defaultFilters = {
        searchTerm: "",
        priceRange: [0, 1500],
        selectedAmenities: [],
        selectedType: "all",
        lifestyleFilters: { party: 'any', pets: 'any', cleanliness: 'any', smoking: 'any' },
        rulesFilters: { gender: 'any', type: 'any' }
    };
    setFilters(defaultFilters);
    localStorage.removeItem('roomFilters');
  }, []);

  return {
    filters,
    filteredRooms,
    allRooms,
    updateSearchTerm,
    updatePriceRange,
    toggleAmenity,
    updateSelectedType,
    updateLifestyleFilter,
    updateRuleFilter,
    resetFilters
  };
};

export default useRooms;
