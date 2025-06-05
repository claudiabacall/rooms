
const LIFESTYLE_KEYS = ['party', 'pets', 'cleanliness', 'smoking'];
const RULES_KEYS = ['gender', 'type'];

const calculateScore = (userProfile, room) => {
  let score = 0;
  const MAX_SCORE_PER_CATEGORY = 100;
  const CATEGORY_COUNT = 4; // Location, Lifestyle, Rules, Budget/Age/Interests

  // 1. Localización (ejemplo simplificado, podría usar distancias reales)
  // Ponderación alta: hasta 25% del total
  if (userProfile.preferences.location && room.location.toLowerCase().includes(userProfile.preferences.location.toLowerCase())) {
    score += MAX_SCORE_PER_CATEGORY; 
  } else if (userProfile.preferences.location && room.location.toLowerCase().includes(userProfile.preferences.location.split(",")[0].trim().toLowerCase())) {
    score += MAX_SCORE_PER_CATEGORY * 0.7; // Coincidencia parcial (primera zona)
  }


  // 2. Estilo de vida
  // Ponderación alta: hasta 25% del total
  let lifestyleMatches = 0;
  let lifestylePotentialMatches = 0;
  LIFESTYLE_KEYS.forEach(key => {
    if (userProfile.lifestyle[key] && room.lifestyle[key]) {
      lifestylePotentialMatches++;
      if (userProfile.lifestyle[key] === room.lifestyle[key]) {
        lifestyleMatches++;
      } else if (userProfile.lifestyle[key] === 'any' || room.lifestyle[key] === 'any') {
         lifestyleMatches += 0.5; // Media puntuación si uno es 'any'
      }
    }
  });
  if (lifestylePotentialMatches > 0) {
    score += (lifestyleMatches / lifestylePotentialMatches) * MAX_SCORE_PER_CATEGORY;
  }


  // 3. Reglas
  // Ponderación alta: hasta 25% del total
  let rulesMatches = 0;
  let rulesPotentialMatches = 0;
  RULES_KEYS.forEach(key => {
    if (userProfile.preferences.rules && userProfile.preferences.rules[key] && room.rules[key]) {
        rulesPotentialMatches++;
        if (userProfile.preferences.rules[key] === room.rules[key] || userProfile.preferences.rules[key] === 'any' || room.rules[key] === 'any') {
            rulesMatches++;
        }
    }
  });
   if (rulesPotentialMatches > 0) {
    score += (rulesMatches / rulesPotentialMatches) * MAX_SCORE_PER_CATEGORY;
  }


  // 4. Presupuesto, Edad, Intereses Comunes
  // Ponderación media para el conjunto: hasta 25% del total
  let subCategoryScore = 0;

  // Presupuesto
  if (userProfile.preferences.budget) {
    const budgetDiff = Math.abs(userProfile.preferences.budget - room.price);
    const budgetTolerance = userProfile.preferences.budget * 0.2; // 20% tolerancia
    if (budgetDiff <= budgetTolerance) {
      subCategoryScore += MAX_SCORE_PER_CATEGORY / 3 * (1 - budgetDiff / budgetTolerance);
    }
  }
  
  // Edad (si hay otros inquilinos) - placeholder
  // if (userProfile.age && room.roommates && room.roommates.length > 0) {
  //   const avgRoommateAge = room.roommates.reduce((sum, r) => sum + r.age, 0) / room.roommates.length;
  //   const ageDiff = Math.abs(userProfile.age - avgRoommateAge);
  //   if (ageDiff <= 5) subCategoryScore += MAX_SCORE_PER_CATEGORY / 3 * (1 - ageDiff/5);
  // } else {
  //    subCategoryScore += MAX_SCORE_PER_CATEGORY / 3 * 0.5; // Si no hay datos de edad de compañeros
  // }


  // Intereses comunes (si hay datos)
  if (userProfile.interests && room.hostInterests) { // Asumiendo que 'room' puede tener 'hostInterests'
    const commonInterests = userProfile.interests.filter(interest => room.hostInterests.includes(interest));
    if (userProfile.interests.length > 0) {
       subCategoryScore += (commonInterests.length / userProfile.interests.length) * (MAX_SCORE_PER_CATEGORY / 3);
    }
  } else {
    subCategoryScore += MAX_SCORE_PER_CATEGORY / 3 * 0.3; // Si no hay datos de intereses
  }
  score += subCategoryScore;


  return Math.min(Math.round((score / (MAX_SCORE_PER_CATEGORY * CATEGORY_COUNT)) * 100), 100);
};

export const getMatchedRooms = (userProfile, roomsList) => {
  if (!userProfile || !roomsList || roomsList.length === 0) {
    return [];
  }

  const scoredRooms = roomsList.map(room => ({
    ...room,
    matchScore: calculateScore(userProfile, room),
  }));

  return scoredRooms.sort((a, b) => b.matchScore - a.matchScore);
};
