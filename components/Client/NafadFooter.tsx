import React from 'react';
import { useI18n } from '../../shared/i18n';

const Logos = {
    nafath: "/imgs/nafad/imgi_1_logo.png",
    vision2030: "/imgs/nafad/imgi_2_vision2030-grey.png",
    sdaia: "/imgs/nafad/imgi_7_sdaia-logo.png",
    moi: "/imgs/nafad/imgi_10_moi_logo_rtl.png",
    shield: "/imgs/nafad/imgi_8_c46b531f-3e65-4bf2-9f17-b1ed016c01be.png",
};

const NafadFooter: React.FC = () => {
    const { t, isRTL } = useI18n();

    return (
        <footer className="bg-[#f8f9fa] border-t border-gray-200 mt-auto py-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="w-full px-4 lg:px-12">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">

                    {/* Right: SDAIA Section (Center on mobile, Start on Desktop) */}
                    <div className="flex flex-col items-center md:items-start text-right order-2 md:order-1 w-full md:w-auto">
                        <span className="text-[10px] text-gray-500 mb-1">{t('developmentAndOperation')}</span>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <img src={Logos.sdaia} alt="SDAIA" className="h-10 w-auto" />
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-[#000] text-sm leading-tight">{t('saudiDataAndAIAuthority')}</span>
                                <span className="font-bold text-[#000] text-sm leading-tight tracking-wider">SDAIA</span>
                            </div>
                        </div>
                        <div className="mt-2 text-[10px] text-gray-500 font-sans text-center md:text-right w-full">
                            {t('nationalUnifiedAccess')} {t('allRightsReserved')} © 2026
                        </div>
                    </div>

                    {/* Center: Links (Order 3 on mobile to be at bottom) */}
                    <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-gray-500 text-xs order-3 md:order-2 md:mt-4 w-full md:w-auto">
                        <a href="#" className="hover:text-[#119e84] transition-colors">{t('homeTitle')}</a>
                        <a href="#" className="hover:text-[#119e84] transition-colors">{t('aboutService')}</a>
                        <a href="#" className="hover:text-[#119e84] transition-colors">{t('contactUs')}</a>
                        <a href="#" className="hover:text-[#119e84] transition-colors">{t('termsAndConditions')}</a>
                        <a href="#" className="hover:text-[#119e84] transition-colors">{t('supportAndHelp')}</a>
                        <a href="#" className="hover:text-[#119e84] transition-colors">{t('privacyPolicy')}</a>
                    </div>

                    {/* Left: Seal (Top on mobile for branding validation?) Or Bottom? 
                       Usually logos are top or bottom. 
                       Let's keep it order-1 on mobile to show trust badge first? 
                       Or order-3?
                       Original was: SDAIA (1), Links (2), Seal (3).
                       On mobile: SDAIA (Top), Links (Mid), Seal (Bot).
                       
                       Let's try: Seal (Top - Branding), SDAIA (Mid), Links (Bot).
                       OR: SDAIA (Bot), Links (Mid), Seal (Top).
                       
                       Let's stick to a cleaner layout:
                       Desktop: SDAIA (Right/Start), Links (Center), Seal (Left/End).
                       Mobile: Seal (Top), Links (Mid), SDAIA (Bot).
                    */}
                    <div className="order-1 md:order-3 flex justify-center md:justify-end w-full md:w-auto">
                        <img src={Logos.shield} alt="Seal" className="h-[60px] md:h-[70px] w-auto mix-blend-multiply" />
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default NafadFooter;
