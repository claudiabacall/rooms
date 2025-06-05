
import React from "react";

const RoomAmenities = ({ amenities, amenitiesDetailsList }) => {
  return (
    <>
      <h3 className="text-xl font-semibold mb-4">Comodidades</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {amenities.map(amenityId => {
          const amenity = amenitiesDetailsList[amenityId];
          return amenity ? (
            <div key={amenityId} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg border">
              {React.cloneElement(amenity.icon, { className: "h-5 w-5 text-primary shrink-0" })}
              <span className="text-sm">{amenity.label}</span>
            </div>
          ) : null;
        })}
      </div>
    </>
  );
};

export default RoomAmenities;
