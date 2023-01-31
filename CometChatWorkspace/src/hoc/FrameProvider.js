import * as React from "react";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import weakMemoize from "@emotion/weak-memoize";
import { FrameContextConsumer } from "react-frame-component";

let memoizedCreateCacheWithContainer = weakMemoize(container => {
    let newCache = createCache({ container,key:"frameprovider" });
    return newCache;
});

export const FrameProvider = props => (
    <FrameContextConsumer>
        {({ document }) => {
            return (
                <CacheProvider value={memoizedCreateCacheWithContainer(document.head)}>
                    {props.children}
                </CacheProvider>
            );
        }}
    </FrameContextConsumer>
);
