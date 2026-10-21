const email = "contato@douglasgaspar.com";

export const contactEmail = email;

export const mailTo = (subject: string, body?: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ""}`;

export const firstConsultationHref =
  "https://cal.com/douglasgaspar/consultorias-servicos";

export const technicalContactHref = mailTo(
  "Sou técnico — vibe coding e no-code",
  "Olá, Douglas! Trabalho com vibe coding ou no-code e quero saber quando houver um espaço para profissionais da área.\n\nMeu contexto é:\n",
);

export const siteCreationProposalHref = firstConsultationHref;

const whatsappNumber = "5511999999999";
const whatsappMessage = "Olá, Douglas! Quero conversar sobre um projeto.";
export const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
