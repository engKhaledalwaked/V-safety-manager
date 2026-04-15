import React from 'react';
import { useI18n } from '../../shared/i18n';
import './HomeFooter.css';


const HomeFooter: React.FC = () => {
    const { t, isRTL } = useI18n();

    return (
        <footer
            className="footer"
            style={{
                display: 'block',
                width: '100%',
                '--footer-direction': isRTL ? 'rtl' : 'ltr',
                '--footer-text-align': isRTL ? 'right' : 'left'
            } as React.CSSProperties}
        >
            <div className="container">
                <div className="footer-top">
                    <div className="footer-row">
                        <div className="footer-links">
                            <h4>{t('inspection')}</h4>
                            <ul>
                                <li><a href="#">{t('inspectionInquiry')}</a></li>
                                <li><a href="#">{t('inspectionFees')}</a></li>
                                <li><a href="#">{t('inspectionLocations')}</a></li>
                                <li><a href="#">{t('bookAppointment')}</a></li>
                            </ul>
                        </div>
                        <div className="footer-links">
                            <h4>{t('supportAndHelp')}</h4>
                            <ul>
                                <li><a href="#">{t('frequentlyAskedQuestions')}</a></li>
                                <li><a href="#">{t('contactUs')}</a></li>
                                <li><a href="#">English</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4>{t('downloadApp')}</h4>
                            <div className="footer-apps">
                                <img src="/imgs/home_page/google_play.svg" alt="Google Play" />
                                <img src="/imgs/home_page/apple_app_store.svg" alt="App Store" />
                            </div>
                            <h4>{t('followUs')}</h4>
                            <ul className="footer-social">
                                <li><img src="/imgs/home_page/X_logo.svg" alt="X" /></li>
                                <li><img src="/imgs/home_page/white_youtube_logo.svg" alt="YouTube" /></li>
                                <li><img src="/imgs/home_page/snapchat_logo.svg" alt="Snapchat" /></li>
                                <li><img src="/imgs/home_page/instagrame_icon.svg" alt="Instagram" /></li>
                                <li><img src="/imgs/home_page/facebook_logo.svg" alt="Facebook" /></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div>
                        <p>{t('allRightsReserved')} <span>©️ 2026</span></p>
                        <p>{t('developedBy')}</p>
                    </div>
                    <div className="company-info">
                        <img src="/imgs/home_page/white-logo.svg" alt="Logo" className="footer-main-logo" />
                        <img src="/imgs/home_page/thiqa-white.png" alt="Thiqa" className="footer-partner-logo" />
                        <img src="/imgs/home_page/digitalCov-white.svg" alt="Digital Government" className="footer-partner-logo" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;
