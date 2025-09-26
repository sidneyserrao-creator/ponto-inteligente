'use client';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { User, TimeLog, Signature, DailyTimeLog } from '@/lib/types';
import { useMemo } from 'react';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7.woff2', fontWeight: 500 },
    { src 'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2ZL7.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/interv13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2', fontWeight: 700 },
  ],
});


const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 'auto',
  },
  headerText: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 600,
  },
  documentTitle: {
    fontSize: 12,
    marginTop: 2,
    color: '#6B7280',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoField: {
    flexDirection: 'column',
  },
  infoLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  infoValue: {
    fontWeight: 500,
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
    backgroundColor: '#F9FAFB',
  },
  tableHeaderRow: {
    margin: "auto",
    flexDirection: "row",
    backgroundColor: '#F3F4F6',
  },
  tableCol: {
    width: "16.66%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: 5,
    fontSize: 9,
  },
  tableHeaderCell: {
    margin: 5,
    fontSize: 9,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1pt solid #E5E7EB',
    paddingTop: 10,
  },
  signatureSection: {
    marginTop: 10,
    textAlign: 'left',
  },
  signatureText: {
    fontSize: 9,
    fontStyle: 'italic',
    color: '#4B5563',
  },
});

const processLogsForPDF = (logs: TimeLog[]): DailyTimeLog[] => {
    const dailyLogsMap: Record<string, any> = {};

    logs.forEach(log => {
        const date = format(parseISO(log.timestamp), 'yyyy-MM-dd');
        if (!dailyLogsMap[date]) {
            dailyLogsMap[date] = { date, logs: {} };
        }
        if(!dailyLogsMap[date].logs[log.action]) {
            dailyLogsMap[date].logs[log.action] = log.timestamp;
        }
    });

    return Object.values(dailyLogsMap).map(day => {
        const { clock_in, clock_out } = day.logs;
        let totalHours = 'N/A';
        if (clock_in && clock_out) {
            const diff = parseISO(clock_out).getTime() - parseISO(clock_in).getTime();
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            totalHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
        return { ...day, totalHours };
    }).sort((a,b) => a.date.localeCompare(b.date));
};


interface TimeSheetDocumentProps {
    user: User;
    logs: TimeLog[];
    signature: Signature | null;
}

export function TimeSheetDocument({ user, logs, signature }: TimeSheetDocumentProps) {
    const monthYear = format(new Date(), 'MMMM de yyyy', { locale: ptBR });
    const dailyLogs = useMemo(() => processLogsForPDF(logs), [logs]);

    return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
           <Image style={styles.logo} src="/logo.png" />
          <View style={styles.headerText}>
            <Text style={styles.companyName}>Bit Segurança</Text>
            <Text style={styles.documentTitle}>Folha de Ponto - {monthYear}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações do Colaborador</Text>
          <View style={styles.userInfo}>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Nome</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
             <View style={styles.infoField}>
              <Text style={styles.infoLabel}>Função</Text>
              <Text style={styles.infoValue}>{user.role}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registros de Ponto</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow} fixed>
              <View style={styles.tableCol}><Text style={styles.tableHeaderCell}>Data</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableHeaderCell}>Dia</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableHeaderCell}>Entrada</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableHeaderCell}>Início Pausa</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableHeaderCell}>Fim Pausa</Text></View>
              <View style={styles.tableCol}><Text style={styles.tableHeaderCell}>Saída</Text></View>
            </View>
            {/* Table Body */}
            {dailyLogs.map(day => (
              <View key={day.date} style={styles.tableRow}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{format(parseISO(day.date), 'dd/MM/yyyy')}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{format(parseISO(day.date), 'EEEE', {locale: ptBR})}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{day.logs.clock_in ? format(parseISO(day.logs.clock_in), 'HH:mm:ss') : '-'}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{day.logs.break_start ? format(parseISO(day.logs.break_start), 'HH:mm:ss') : '-'}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{day.logs.break_end ? format(parseISO(day.logs.break_end), 'HH:mm:ss') : '-'}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{day.logs.clock_out ? format(parseISO(day.logs.clock_out), 'HH:mm:ss') : '-'}</Text></View>
              </View>
            ))}
             {dailyLogs.length === 0 && (
                <View style={styles.tableRow}>
                    <View style={{...styles.tableCol, width: '100%'}}><Text style={styles.tableCell}>Nenhum registro para este mês.</Text></View>
                </View>
             )}
          </View>
        </View>

        <View style={styles.footer} fixed>
            {signature && (
                <View style={styles.signatureSection}>
                    <Text style={styles.signatureText}>
                        Assinado digitalmente por {user.name} em {format(parseISO(signature.signedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}.
                    </Text>
                    <Text style={styles.signatureText}>
                        Este documento é uma representação fiel dos registros de ponto e sua assinatura confirma a veracidade das informações.
                    </Text>
                </View>
            )}
            <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 10 }}>Gerado por Bit Segurança - Sistema de Ponto Eletrônico</Text>
        </View>
      </Page>
    </Document>
  );
}
