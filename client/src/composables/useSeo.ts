import { onMounted, onUnmounted, watch, unref, computed } from 'vue';
import type { MaybeRef } from 'vue';

interface SeoOptions {
  title?: MaybeRef<string>;
  description?: MaybeRef<string>;
  keywords?: MaybeRef<string>;
  image?: MaybeRef<string>;
  url?: MaybeRef<string>;
  type?: MaybeRef<'website' | 'article'>;
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
    getOrCreateMeta('og:image:secure_url', true).setAttribute('content', image);
    getOrCreateMeta('og:image:width', true).setAttribute('content', '1200');
    getOrCreateMeta('og:image:height', true).setAttribute('content', '630');
    getOrCreateMeta('twitter:image', true).setAttribute('content', image);
    getOrCreateMeta('twitter:card', true).setAttribute('content', 'summary_large_image');
  }
};

const setType = (type: 'website' | 'article') => {
  getOrCreateMeta('og:type', true).setAttribute('content', type);
};

const setUrl = (url: string) => {
  if (url) {
    getOrCreateMeta('og:url', true).setAttribute('content', url);
  }
};

export const useSeo = (options: SeoOptions = {}) => {
  onMounted(() => {
    if (!originalTitle) {
      originalTitle = document.title;
    }

    if (options.title) {
      setTitle(unref(options.title) || '');
    }
    if (options.description) {
      setDescription(unref(options.description) || '');
    }
    if (options.keywords) {
      setKeywords(unref(options.keywords) || '');
    }
    if (options.image) {
      setImage(unref(options.image) || '');
    }
    if (options.url) {
      setUrl(unref(options.url) || '');
    }
    if (options.type) {
      setType(unref(options.type) || 'website');
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

  if (options.image) {
    watch(
      () => unref(options.image),
      (newImage) => {
        if (newImage) setImage(newImage);
      }
    );
  }

  if (options.url) {
    watch(
      () => unref(options.url),
      (newUrl) => {
        if (newUrl) setUrl(newUrl);
      }
    );
  }

  if (options.type) {
    watch(
      () => unref(options.type),
      (newType) => {
        if (newType) setType(newType);
      }
    );
  }

  onUnmounted(() => {
    if (originalTitle) {
      document.title = originalTitle;
    }
  });
};

interface ArticleSeoData {
  title?: string;
  summary?: string;
  coverImage?: string;
  tags?: string[];
}

export const useArticleSeo = (article: MaybeRef<ArticleSeoData | null>) => {
  useSeo({
    title: computed(() => unref(article)?.title || ''),
    description: computed(() => unref(article)?.summary || ''),
    image: computed(() => unref(article)?.coverImage || ''),
    keywords: computed(() => unref(article)?.tags?.join(', ') || ''),
    type: 'article',
  });
};
