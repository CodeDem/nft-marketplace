import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
    return (
        <Html>
            <Head>
                <script
                    data-partytown-config
                    dangerouslySetInnerHTML={{
                        __html: `
                        (function (id, s) {
                            var s = document.createElement('script');
                            s.type = 'text/javascript';
                            s.async = false;
                            s.src = 'https://mintmage-sdk.s3.us-west-2.amazonaws.com/sdk2.js';
                            var x = document.getElementsByTagName('script')[0];
                            x.parentNode.insertBefore(s, x);
                        })();
            `,
                    }}
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    )
}