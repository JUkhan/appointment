import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  IonToast,
  IonIcon,
  IonItem,
  IonDatetime,
  IonModal,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
  calendarOutline,
  trendingUpOutline,
} from 'ionicons/icons';
import apiService from '../services/apiService';
import storageService from '../services/storageService';
import { CLIENT_ID } from '../constants/api';
import type { AnalyticsDataPoint } from '../types';

const AnalyticsPage: React.FC = () => {
  const [clientId, setClientId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<'day' | 'month' | 'year'>('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadClientId();
  }, []);

  useEffect(() => {
    if (clientId) {
      fetchAnalytics('prev');
    }
  }, [clientId, date, type]);

  const loadClientId = async () => {
    try {
      const id = await storageService.getItem(CLIENT_ID);
      if (id) {
        setClientId(id);
      } else {
        setToastMessage('Client ID not found');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error loading client ID:', error);
      setToastMessage('Failed to load client ID');
      setShowToast(true);
    }
  };

  const fetchAnalytics = async (move: 'next' | 'prev') => {
    if (!clientId) return;

    setIsLoading(true);
    try {
      const data = await apiService.getAnalytics({
        client_id: clientId,
        date: date,
        type: type,
        move: move,
      });
      setAnalyticsData(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setToastMessage(error.response?.data?.error || 'Failed to fetch analytics');
      setShowToast(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    fetchAnalytics('prev');
  };

  const handleNext = () => {
    fetchAnalytics('next');
  };

  const handleTypeChange = (newType: 'day' | 'month' | 'year') => {
    setType(newType);
  };

  const handleDateChange = (value: string | string[] | null | undefined) => {
    if (typeof value === 'string') {
      setDate(value.split('T')[0]);
      setShowDatePicker(false);
    }
  };

  const getTotalPrice = () => {
    return analyticsData.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  };

  const getMaxPrice = () => {
    if (analyticsData.length === 0) return 1;
    return Math.max(...analyticsData.map(item => item.price));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonMenuButton />
          </IonButtons>
          <IonTitle>Transaction Analytics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Controls */}
        <IonCard>
          <IonCardContent>
            {/* Date Picker */}
            <IonItem lines="none">
              <IonIcon icon={calendarOutline} slot="start" />
              <IonLabel>Start Date: {date}</IonLabel>
              <IonButton
                fill="clear"
                slot="end"
                onClick={() => setShowDatePicker(true)}
              >
                Change
              </IonButton>
            </IonItem>

            {/* Type Selector */}
            <IonSegment
              value={type}
              onIonChange={(e) => handleTypeChange(e.detail.value as 'day' | 'month' | 'year')}
              style={{ marginTop: '1rem' }}
            >
              <IonSegmentButton value="day">
                <IonLabel>Daily</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="month">
                <IonLabel>Monthly</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="year">
                <IonLabel>Yearly</IonLabel>
              </IonSegmentButton>
            </IonSegment>

            {/* Navigation Buttons */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '1rem',
              gap: '0.5rem',
            }}>
              <IonButton
                expand="block"
                onClick={handlePrevious}
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                <IonIcon icon={chevronBackOutline} slot="start" />
                Previous
              </IonButton>
              <IonButton
                expand="block"
                onClick={handleNext}
                disabled={isLoading}
                style={{ flex: 1 }}
              >
                Next
                <IonIcon icon={chevronForwardOutline} slot="end" />
              </IonButton>
            </div>
          </IonCardContent>
        </IonCard>

        {/* Loading State */}
        {isLoading && (
          <div style={{ textAlign: 'center', margin: '2rem' }}>
            <IonSpinner name="crescent" />
            <IonText>
              <p>Loading analytics...</p>
            </IonText>
          </div>
        )}

        {/* Summary Card */}
        {!isLoading && analyticsData.length > 0 && (
          <IonCard color="primary">
            <IonCardHeader>
              <IonCardTitle>Total Revenue</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {formatCurrency(parseFloat(getTotalPrice()))} Taka
              </IonText>
              <br />
              <IonText style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Across {analyticsData.length} periods
              </IonText>
            </IonCardContent>
          </IonCard>
        )}

        {/* Data Visualization */}
        {!isLoading && analyticsData.length > 0 && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={trendingUpOutline} style={{ marginRight: '0.5rem' }} />
                Analytics Overview
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonGrid>
                {analyticsData.map((item, index) => {
                  const maxPrice = getMaxPrice();
                  const barWidth = maxPrice > 0 ? (item.price / maxPrice) * 100 : 0;

                  return (
                    <IonRow key={index} style={{ marginBottom: '1rem' }}>
                      <IonCol size="12">
                        <div style={{ marginBottom: '0.25rem' }}>
                          <IonText>
                            <strong>{item.label}</strong>
                          </IonText>
                          <IonText style={{ float: 'right', color: 'var(--ion-color-primary)' }}>
                            <strong>{formatCurrency(item.price)} Taka</strong>
                          </IonText>
                        </div>
                        <div
                          style={{
                            width: '100%',
                            height: '30px',
                            backgroundColor: 'var(--ion-color-light)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <div
                            style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              backgroundColor: 'var(--ion-color-primary)',
                              transition: 'width 0.3s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              paddingRight: '8px',
                            }}
                          >
                            {item.price > 0 && (
                              <IonText style={{ color: 'white', fontSize: '0.8rem' }}>
                                {barWidth.toFixed(0)}%
                              </IonText>
                            )}
                          </div>
                        </div>
                      </IonCol>
                    </IonRow>
                  );
                })}
              </IonGrid>
            </IonCardContent>
          </IonCard>
        )}

        {/* Empty State */}
        {!isLoading && analyticsData.length === 0 && (
          <IonCard>
            <IonCardContent>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <IonText color="medium">
                  <h3>No Data Available</h3>
                  <p>There are no transactions for the selected period.</p>
                </IonText>
              </div>
            </IonCardContent>
          </IonCard>
        )}

        {/* Date Picker Modal */}
        <IonModal isOpen={showDatePicker} onDidDismiss={() => setShowDatePicker(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Date</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowDatePicker(false)}>Close</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <IonDatetime
              presentation="date"
              value={date}
              onIonChange={(e) => handleDateChange(e.detail.value)}
            />
          </IonContent>
        </IonModal>

        {/* Toast */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default AnalyticsPage;
