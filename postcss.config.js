import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import postcssPrefixSelector from 'postcss-prefix-selector';

export default {
  plugins: [
    tailwindcss,
    autoprefixer,
    postcssPrefixSelector({
      prefix: '.indexeddb-debug-bar',
      includeUniversal: true,
      transform: (prefix, selector, prefixedSelector) => {
        return prefixedSelector;
      },
    }),
  ],
};
