'use client';

import React, { createContext, useContext } from 'react';

const BasePathContext = createContext('');

export const BasePathProvider = ({ config, children }) => {
  let basePath = '';

  if(config){
    basePath = config.basePath;
  }

  return (
    <BasePathContext.Provider value={basePath}>
      {children}
    </BasePathContext.Provider>
  );
};

export const useBasePath = () => useContext(BasePathContext);
