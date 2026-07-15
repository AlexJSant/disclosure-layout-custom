import React from 'react'

export const useRuntime = jest.fn(() => ({ extensions: {} }))

export const useTreePath = jest.fn(() => ({ treePath: '' }))

export const Helmet = ({ children }) => <>{children}</>
