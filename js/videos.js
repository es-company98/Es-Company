/**

 * Vidéos YouTube ES-Company

 *

 * intro    → courte vidéo d'introduction (modal + section présentation)

 * tutoriel → longue vidéo tutoriel (section dédiée + galerie)

 *

 * Extraire l'ID depuis l'URL :

 * https://www.youtube.com/watch?v=ABC123  →  ABC123

 * https://youtu.be/ABC123                 →  ABC123

 */

export const youtubeVideos = {

  intro: "",

  tutoriel: "",

};



export const getEmbedUrl = (videoId, { autoplay = false } = {}) => {

  if (!videoId || typeof videoId !== "string") return null;

  const id = videoId.trim();

  if (!id) return null;



  const params = new URLSearchParams({

    rel: "0",

    modestbranding: "1",

  });

  if (autoplay) params.set("autoplay", "1");



  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;

};



export const getThumbnailUrl = (videoId) => {

  if (!videoId || !videoId.trim()) return null;

  return `https://i.ytimg.com/vi/${videoId.trim()}/hqdefault.jpg`;

};

