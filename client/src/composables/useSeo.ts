import { onMounted, onUnmounted, watch } from 'vue';
import type { MaybeRef } from 'vue';
import { unref } from 'vue';

interface SeoOptions {
  title?: MaybeRef<string>;
  description?: MaybeRef<string>;
  keywords?: MaybeRef<string>;
  image?: MaybeRef<string>;
  url?: string;
  type?: 'website' | 'article';
}

const defaultMeta = {
  title: import.meta.env.VITE_SITE_TITLE || 'Giovan',
  description: import.meta.env.VITE_SITE_DESCRIPTION || 'Personal blog',
};

let originalTitle = '';
let metaElements: Map<string, HTMLMetaElement> = new Map();

const getOrCreateMeta = (name: string, property?: boolean): HTMLMetaElement => {
  const key = property ? `property:${name}` : `name:${name}`;
  
  if (metaElements.has(key)) {
    return metaElements.get(key)!;
  }

  let meta = document.querySelector(
    property ? `meta[property="${name}"]` : `meta[name="${name}"]`
  ) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement('meta');
    if (property) {
      meta.setAttribute('property', name);
    } else {
      meta.setAttribute('name', name);
    }
    document.head.appendChild(meta);
  }

  metaElements.set(key, meta);
  return meta;
};

const setTitle = (title: string) => {
  document.title = title || defaultMeta.title;
  getOrCreateMeta('og:title', true).setAttribute('content', title || defaultMeta.title);
  getOrCreateMeta('twitter:title', true).setAttribute('content', title || defaultMeta.title);
};

const setDescription = (description: string) => {
  const desc = description || defaultMeta.description;
  getOrCreateMeta('description').setAttribute('content', desc);
  getOrCreateMeta('og:description', true).setAttribute('content', desc);
  getOrCreateMeta('twitter:description', true).setAttribute('content', desc);
};

const setKeywords = (keywords: string) => {
  if (keywords) {
    getOrCreateMeta('keywords').setAttribute('content', keywords);
  }
};

const setImage = (image: string) => {
  if (image) {
    getOrCreateMeta('og:image', true).setAttribute('content', image);
    getOrCreateMeta('twitter:image', true).setAttribute('content', image);
  }
};

const setType = (type: 'website' | 'article') => {
  getOrCreateMeta('og:type', true).setAttribute('content', type);
};

export const useSeo = (options: SeoOptions = {}) => {
  onMounted(() => {
    if (!originalTitle) {
      originalTitle = document.title;
    }

    if (options.title) {
      setTitle(unref(options.title));
    }
    if (options.description) {
      setDescription(unref(options.description));
    }
    if (options.keywords) {
      setKeywords(unref(options.keywords));
    }
    if (options.image) {
      setImage(unref(options.image));
    }
    if (options.type) {
      setType(options.type);
    }
  });

  if (options.title) {
    watch(
      () => unref(options.title),
      (newTitle) => {
        if (newTitle) setTitle(newTitle);
      }
    );
  }

  if (options.description) {
    watch(
      () => unref(options.description),
      (newDesc) => {
        if (newDesc) setDescription(newDesc);
      }
    );
  }

  onUnmounted(() => {
    if (originalTitle) {
      document.title = originalTitle;
    }
  });
};

export const useArticleSeo = (article: { title?: string; summary?: string; coverImage?: string; tags?: string[] }) => {
  useSeo({
    title: article.title,
    description: article.summary,
    image: article.coverImage,
    keywords: article.tags?.join(', '),
    type: 'article',
  });
};
