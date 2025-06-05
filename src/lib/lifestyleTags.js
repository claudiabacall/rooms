export function generateLifestyleTags(lifestyle) {
    const tags = [];

    if (lifestyle.party === "si") tags.push("fiestero");
    if (lifestyle.party === "no") tags.push("tranquilo");

    if (lifestyle.pets === "si") tags.push("pet-friendly");
    if (lifestyle.pets === "no") tags.push("prefiere sin mascotas");

    if (lifestyle.cleanliness === "ordenado") tags.push("ordenado");
    if (lifestyle.cleanliness === "relajado") tags.push("relajado");

    if (lifestyle.smoking === "si") tags.push("fumador");
    if (lifestyle.smoking === "no") tags.push("no fumador");

    if (lifestyle.schedules === "si") tags.push("nocturno");
    if (lifestyle.schedules === "no") tags.push("madrugador");

    if (lifestyle.visits === "si") tags.push("recibe visitas");
    if (lifestyle.visits === "no") tags.push("pocas visitas");

    if (lifestyle.cooking === "si") tags.push("cocinero");
    if (lifestyle.cooking === "no") tags.push("no cocina");

    return tags;
}
