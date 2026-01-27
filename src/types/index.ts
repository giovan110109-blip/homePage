export interface PersonalInfo {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  location: string;
  wechat:string;
  socialLinks: SocialLink[];

}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'tools' | 'design';
  level: number;
  icon: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: string[];
  demoUrl?: string;
  githubUrl?: string;
  featured: boolean;
  createdAt: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  pubDate: string;
  author?: string;
  categories?: string[];
}

export interface RSSFeed {
  title: string;
  description: string;
  link: string;
  items: Article[];
}

export interface TenYearPromise {
  startDate: string;
  currentDate: string;
  daysCount: number;
}