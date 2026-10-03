import{r as c,j as r}from"./ui-CKQ9PkXL.js";import{u as _,K as b,q as h,L as k}from"./app-CXGKiCta.js";import{NewYork as v}from"./NewYork-MjZwi8-1.js";import{Toronto as g}from"./Toronto-CQV4yYfi.js";import{Rio as T}from"./Rio-DUaRLDDi.js";import{London as P}from"./London-DG2y1Lx5.js";import{Istanbul as L}from"./Istanbul-qrdNj9P0.js";import{Mumbai as A}from"./Mumbai-DgBikh7m.js";import{HongKong as D}from"./HongKong-BqTUIczl.js";import{Tokyo as I}from"./Tokyo-BKZLMPIt.js";import{Sydney as R}from"./Sydney-CievFjA0.js";import{Paris as q}from"./Paris-IXNWjE5J.js";import{u as C}from"./usePdfDownload-CVbS_0kk.js";import{f as E}from"./currency-kzm_C5pv.js";import"./vendor-B1hewrmX.js";/* empty css            *//* empty css                  */import"./utils-DBYZG17H.js";import"./QRCodeGenerator-SckBEHiK.js";function oo(){const{t:i}=_(),{invoice:e,invoiceSettings:o}=b().props,{logoDark:m}=h(),n=c.useRef(null),{downloadPDF:l}=C(),p=(o==null?void 0:o.invoice_qr_display)==="true"||(o==null?void 0:o.invoice_qr_display)===!0,u=(o==null?void 0:o.invoice_footer_title)||"",d=(o==null?void 0:o.invoice_footer_notes)||"",a=(o==null?void 0:o.invoice_template)||"london",f=(o==null?void 0:o.invoice_color)||"#3b82f6",x=o!=null&&o.invoice_logo&&o.invoice_logo.trim()!==""?o.invoice_logo:m,y=s=>E(s);c.useEffect(()=>{const s=setTimeout(()=>{j()},1500);return()=>clearTimeout(s)},[]);const j=async()=>{n.current&&(await l(n.current,`Invoice-${e.invoice_number}.pdf`),window.close())},t={invoice:e,color:f,showQr:p,invoiceUrl:route("invoices.payment",e.payment_token),footerTitle:u,footerNotes:d,remainingAmount:e.balance_due,formatAmount:y,t:i,companyLogo:x},w=()=>{switch(a==null?void 0:a.toLowerCase()){case"new_york":return r.jsx(v,{...t});case"toronto":return r.jsx(g,{...t});case"rio":return r.jsx(T,{...t});case"istanbul":return r.jsx(L,{...t});case"mumbai":return r.jsx(A,{...t});case"hong_kong":return r.jsx(D,{...t});case"tokyo":return r.jsx(I,{...t});case"sydney":return r.jsx(R,{...t});case"paris":return r.jsx(q,{...t});case"london":default:return r.jsx(P,{...t})}};return r.jsxs(r.Fragment,{children:[r.jsxs(k,{children:[r.jsx("title",{children:`${i("Invoice Preview")} - #${e.invoice_number}`}),r.jsx("style",{children:`
                    body {
                        background-color: #f3f4f6;
                    }
                    @media print {
                        body {
                            background-color: #ffffff;
                            print-color-adjust: exact;
                            -webkit-print-color-adjust: exact;
                        }
                        .no-print {
                            display: none !important;
                        }
                        .print-area {
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            width: 100% !important;
                        }
                    }
                `})]}),r.jsx("div",{className:"min-h-screen py-10 px-4 flex justify-center bg-gray-100",children:r.jsx("div",{ref:n,className:"print-area w-full max-w-[900px] bg-white p-10 shadow-lg rounded-xl border border-gray-200 transition-all duration-200",children:w()})})]})}export{oo as default};
